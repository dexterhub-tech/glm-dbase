/**
 * Comprehensive Error Recovery Mechanisms
 * 
 * Provides automatic retry logic, user-initiated recovery options,
 * fallback authentication methods, and graceful degradation for service unavailability.
 * 
 * Requirements: 2.1, 2.4, 4.3
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, clearAccessToken, setAccessToken } from "@/utils/authApi";
import { logAuthEvent, logSystemEvent, logNetworkEvent } from "@/utils/comprehensiveLogging";
import { 
  networkManager, 
  getCachedAuthState, 
  cacheAuthState,
  generateConnectionError,
  type NetworkState,
  type ConnectionError 
} from "@/utils/networkConnectivity";

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  timeoutMs?: number;
}

export interface RecoveryOptions {
  enableAutoRetry: boolean;
  enableFallbackAuth: boolean;
  enableOfflineMode: boolean;
  enableGracefulDegradation: boolean;
  userInitiatedRecovery: boolean;
}

export interface RecoveryResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  recoveryMethod?: 'retry' | 'fallback' | 'offline' | 'degraded' | 'user_initiated';
  attemptsUsed: number;
  fallbackUsed: boolean;
  offlineMode: boolean;
}

export interface OperationContext {
  operationId: string;
  operationType: 'auth' | 'database' | 'network' | 'ui' | 'system';
  userId?: string;
  metadata?: Record<string, any>;
}

// Default retry configurations for different operation types
const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
  auth: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['network', 'timeout', 'rate_limit', 'temporary'],
    timeoutMs: 15000,
  },
  database: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    retryableErrors: ['network', 'timeout', 'connection', 'temporary'],
    timeoutMs: 10000,
  },
  network: {
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['network', 'timeout', 'connection'],
    timeoutMs: 20000,
  },
  ui: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    retryableErrors: ['timeout', 'temporary'],
    timeoutMs: 5000,
  },
  system: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    retryableErrors: ['network', 'timeout', 'temporary'],
    timeoutMs: 20000,
  },
};

// Default recovery options
const DEFAULT_RECOVERY_OPTIONS: RecoveryOptions = {
  enableAutoRetry: true,
  enableFallbackAuth: true,
  enableOfflineMode: true,
  enableGracefulDegradation: true,
  userInitiatedRecovery: true,
};

class ErrorRecoveryManager {
  private activeOperations = new Map<string, AbortController>();
  private recoveryOptions: RecoveryOptions;
  private retryConfigs: Record<string, RetryConfig>;
  private fallbackAuthMethods: Array<() => Promise<any>> = [];
  private degradationHandlers = new Map<string, () => Promise<any>>();

  constructor(
    options: Partial<RecoveryOptions> = {},
    customRetryConfigs: Partial<Record<string, RetryConfig>> = {}
  ) {
    this.recoveryOptions = { ...DEFAULT_RECOVERY_OPTIONS, ...options };
    this.retryConfigs = { ...DEFAULT_RETRY_CONFIGS, ...customRetryConfigs };
    this.initializeFallbackMethods();
    this.initializeDegradationHandlers();
  }

  /**
   * Execute an operation with comprehensive error recovery
   */
  public async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: OperationContext,
    customConfig?: Partial<RetryConfig>,
    customOptions?: Partial<RecoveryOptions>
  ): Promise<RecoveryResult<T>> {
    const config = { ...this.retryConfigs[context.operationType], ...customConfig };
    const options = { ...this.recoveryOptions, ...customOptions };
    
    logSystemEvent('RECOVERY_OPERATION_START', {
      operationId: context.operationId,
      operationType: context.operationType,
      userId: context.userId,
      config,
      options
    });

    // Create abort controller for this operation
    const abortController = new AbortController();
    this.activeOperations.set(context.operationId, abortController);

    let lastError: Error | null = null;
    let attemptsUsed = 0;
    let fallbackUsed = false;
    let offlineMode = false;

    try {
      // First, try the operation with automatic retry
      if (options.enableAutoRetry) {
        const retryResult = await this.executeWithRetry(
          operation,
          config,
          context,
          abortController.signal
        );

        if (retryResult.success) {
          return {
            success: true,
            data: retryResult.data,
            recoveryMethod: retryResult.attemptsUsed > 1 ? 'retry' : undefined,
            attemptsUsed: retryResult.attemptsUsed,
            fallbackUsed: false,
            offlineMode: false,
          };
        }

        lastError = retryResult.error!;
        attemptsUsed = retryResult.attemptsUsed;
      } else {
        // Single attempt without retry
        try {
          const data = await this.executeWithTimeout(operation, config.timeoutMs, abortController.signal);
          return {
            success: true,
            data,
            attemptsUsed: 1,
            fallbackUsed: false,
            offlineMode: false,
          };
        } catch (error) {
          lastError = error as Error;
          attemptsUsed = 1;
        }
      }

      // If primary operation failed, try fallback methods
      if (options.enableFallbackAuth && context.operationType === 'auth') {
        logAuthEvent('ATTEMPTING_FALLBACK_AUTH', {
          operationId: context.operationId,
          primaryError: lastError?.message
        });

        const fallbackResult = await this.tryFallbackAuthentication(context);
        if (fallbackResult.success) {
          fallbackUsed = true;
          return {
            success: true,
            data: fallbackResult.data,
            recoveryMethod: 'fallback',
            attemptsUsed,
            fallbackUsed: true,
            offlineMode: false,
          };
        }
      }

      // Try offline mode if enabled
      if (options.enableOfflineMode) {
        const offlineResult = await this.tryOfflineMode(context);
        if (offlineResult.success) {
          offlineMode = true;
          return {
            success: true,
            data: offlineResult.data,
            recoveryMethod: 'offline',
            attemptsUsed,
            fallbackUsed,
            offlineMode: true,
          };
        }
      }

      // Try graceful degradation
      if (options.enableGracefulDegradation) {
        const degradedResult = await this.tryGracefulDegradation(context);
        if (degradedResult.success) {
          return {
            success: true,
            data: degradedResult.data,
            recoveryMethod: 'degraded',
            attemptsUsed,
            fallbackUsed,
            offlineMode,
          };
        }
      }

      // All recovery methods failed
      logSystemEvent('RECOVERY_ALL_METHODS_FAILED', {
        operationId: context.operationId,
        operationType: context.operationType,
        attemptsUsed,
        finalError: lastError?.message
      });

      return {
        success: false,
        error: lastError || new Error('All recovery methods failed'),
        attemptsUsed,
        fallbackUsed,
        offlineMode,
      };

    } finally {
      // Clean up
      this.activeOperations.delete(context.operationId);
    }
  }

  /**
   * Execute operation with automatic retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: OperationContext,
    signal: AbortSignal
  ): Promise<{ success: boolean; data?: T; error?: Error; attemptsUsed: number }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      if (signal.aborted) {
        throw new Error('Operation aborted');
      }

      try {
        logSystemEvent('RETRY_ATTEMPT', {
          operationId: context.operationId,
          attempt,
          maxAttempts: config.maxAttempts
        });

        const data = await this.executeWithTimeout(operation, config.timeoutMs, signal);
        
        logSystemEvent('RETRY_SUCCESS', {
          operationId: context.operationId,
          attempt,
          totalAttempts: attempt
        });

        return { success: true, data, attemptsUsed: attempt };

      } catch (error) {
        lastError = error as Error;
        
        logSystemEvent('RETRY_ATTEMPT_FAILED', {
          operationId: context.operationId,
          attempt,
          error: lastError.message,
          isRetryable: this.isRetryableError(lastError, config)
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config) || attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        logSystemEvent('RETRY_DELAY', {
          operationId: context.operationId,
          attempt,
          delay: jitteredDelay
        });

        await this.sleep(jitteredDelay);
      }
    }

    return { 
      success: false, 
      error: lastError || new Error('Max retry attempts reached'), 
      attemptsUsed: config.maxAttempts 
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 10000,
    signal?: AbortSignal
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Handle abort signal
      const abortHandler = () => {
        clearTimeout(timeoutId);
        reject(new Error('Operation aborted'));
      };

      if (signal) {
        signal.addEventListener('abort', abortHandler);
      }

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          reject(error);
        });
    });
  }

  /**
   * Check if an error is retryable based on configuration
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name?.toLowerCase() || '';
    
    // Check against retryable error patterns
    return config.retryableErrors.some(pattern => 
      errorMessage.includes(pattern) || 
      errorName.includes(pattern) ||
      this.matchesErrorPattern(error, pattern)
    );
  }

  /**
   * Match error against specific patterns
   */
  private matchesErrorPattern(error: Error, pattern: string): boolean {
    switch (pattern) {
      case 'network':
        return error.message.includes('fetch') || 
               error.message.includes('network') ||
               error.message.includes('connection') ||
               error.name === 'NetworkError';
      
      case 'timeout':
        return error.message.includes('timeout') ||
               error.message.includes('timed out') ||
               error.name === 'TimeoutError';
      
      case 'rate_limit':
        return error.message.includes('rate limit') ||
               error.message.includes('too many requests') ||
               (error as any).status === 429;
      
      case 'temporary':
        return error.message.includes('temporary') ||
               error.message.includes('unavailable') ||
               error.message.includes('service') ||
               (error as any).status >= 500;
      
      case 'connection':
        return error.message.includes('connection') ||
               error.message.includes('connect') ||
               error.message.includes('ECONNREFUSED');
      
      default:
        return false;
    }
  }

  /**
   * Try fallback authentication methods
   */
  private async tryFallbackAuthentication(context: OperationContext): Promise<{ success: boolean; data?: any }> {
    logAuthEvent('FALLBACK_AUTH_START', { operationId: context.operationId });

    // Try cached authentication state first
    const cachedState = getCachedAuthState();
    if (cachedState && cachedState.user) {
      logAuthEvent('FALLBACK_AUTH_CACHED_SUCCESS', {
        operationId: context.operationId,
        userId: cachedState.user._id,
        cacheAge: Date.now() - cachedState.timestamp.getTime()
      });

      return {
        success: true,
        data: {
          user: cachedState.user,
          userRole: cachedState.userRole,
          source: 'cache',
          limited: true
        }
      };
    }

    // Try session restoration from storage
    try {
      const storedSession = localStorage.getItem('supabase.auth.token');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        if (sessionData.access_token) {
          // Attempt to restore session
          const { data, error } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token
          });

          if (data.user && !error) {
            logAuthEvent('FALLBACK_AUTH_SESSION_RESTORE_SUCCESS', {
              operationId: context.operationId,
              userId: data.user.id
            });

            return {
              success: true,
              data: {
                user: data.user,
                session: data.session,
                source: 'session_restore'
              }
            };
          }
        }
      }
    } catch (error) {
      logAuthEvent('FALLBACK_AUTH_SESSION_RESTORE_FAILED', {
        operationId: context.operationId
      }, error);
    }

    // Try other fallback methods registered by the application
    for (const fallbackMethod of this.fallbackAuthMethods) {
      try {
        const result = await fallbackMethod();
        if (result) {
          logAuthEvent('FALLBACK_AUTH_CUSTOM_SUCCESS', {
            operationId: context.operationId
          });

          return {
            success: true,
            data: {
              ...result,
              source: 'custom_fallback'
            }
          };
        }
      } catch (error) {
        logAuthEvent('FALLBACK_AUTH_CUSTOM_FAILED', {
          operationId: context.operationId
        }, error);
      }
    }

    logAuthEvent('FALLBACK_AUTH_ALL_FAILED', { operationId: context.operationId });
    return { success: false };
  }

  /**
   * Try offline mode with cached data
   */
  private async tryOfflineMode(context: OperationContext): Promise<{ success: boolean; data?: any }> {
    logNetworkEvent('OFFLINE_MODE_ATTEMPT', {
      operationId: context.operationId,
      operationType: context.operationType
    });

    // Check if we have cached data for this operation type
    const cachedState = getCachedAuthState();
    
    if (context.operationType === 'auth' && cachedState) {
      logNetworkEvent('OFFLINE_MODE_AUTH_SUCCESS', {
        operationId: context.operationId,
        userId: cachedState.user?._id
      });

      return {
        success: true,
        data: {
          ...cachedState,
          offline: true,
          limited: true,
          message: 'Operating in offline mode with cached data'
        }
      };
    }

    // For other operation types, check if we have relevant cached data
    try {
      const cacheKey = `offline_${context.operationType}_${context.operationId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Use cached data if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          logNetworkEvent('OFFLINE_MODE_CACHED_DATA_SUCCESS', {
            operationId: context.operationId,
            cacheAge
          });

          return {
            success: true,
            data: {
              ...parsed.data,
              offline: true,
              cached: true,
              cacheAge
            }
          };
        }
      }
    } catch (error) {
      logNetworkEvent('OFFLINE_MODE_CACHE_ERROR', {
        operationId: context.operationId
      }, error);
    }

    return { success: false };
  }

  /**
   * Try graceful degradation
   */
  private async tryGracefulDegradation(context: OperationContext): Promise<{ success: boolean; data?: any }> {
    logSystemEvent('GRACEFUL_DEGRADATION_ATTEMPT', {
      operationId: context.operationId,
      operationType: context.operationType
    });

    const handler = this.degradationHandlers.get(context.operationType);
    if (handler) {
      try {
        const result = await handler();
        
        logSystemEvent('GRACEFUL_DEGRADATION_SUCCESS', {
          operationId: context.operationId,
          operationType: context.operationType
        });

        return {
          success: true,
          data: {
            ...result,
            degraded: true,
            message: 'Operating with reduced functionality'
          }
        };
      } catch (error) {
        logSystemEvent('GRACEFUL_DEGRADATION_FAILED', {
          operationId: context.operationId,
          operationType: context.operationType
        }, error);
      }
    }

    // Default degradation strategies
    switch (context.operationType) {
      case 'auth':
        return {
          success: true,
          data: {
            user: null,
            isAuthenticated: false,
            degraded: true,
            message: 'Authentication unavailable - limited access mode'
          }
        };

      case 'database':
        return {
          success: true,
          data: {
            data: [],
            degraded: true,
            message: 'Database unavailable - showing cached or default data'
          }
        };

      case 'ui':
        return {
          success: true,
          data: {
            component: 'fallback',
            degraded: true,
            message: 'Showing simplified interface'
          }
        };

      default:
        return { success: false };
    }
  }

  /**
   * User-initiated recovery methods
   */
  public async initiateUserRecovery(
    operationType: string,
    recoveryAction: 'retry' | 'refresh' | 'reset' | 'clear_cache' | 'force_logout'
  ): Promise<RecoveryResult> {
    logSystemEvent('USER_INITIATED_RECOVERY', {
      operationType,
      recoveryAction
    });

    try {
      switch (recoveryAction) {
        case 'retry':
          // Retry the last failed operation
          return await this.retryLastFailedOperation(operationType);

        case 'refresh':
          // Refresh authentication state
          return await this.refreshAuthenticationState();

        case 'reset':
          // Reset application state
          return await this.resetApplicationState();

        case 'clear_cache':
          // Clear all cached data
          return await this.clearAllCaches();

        case 'force_logout':
          // Force logout and clear all data
          return await this.forceLogout();

        default:
          throw new Error(`Unknown recovery action: ${recoveryAction}`);
      }
    } catch (error) {
      logSystemEvent('USER_INITIATED_RECOVERY_FAILED', {
        operationType,
        recoveryAction
      }, error);

      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }

  /**
   * Register a fallback authentication method
   */
  public registerFallbackAuthMethod(method: () => Promise<any>): void {
    this.fallbackAuthMethods.push(method);
    logSystemEvent('FALLBACK_AUTH_METHOD_REGISTERED', {
      totalMethods: this.fallbackAuthMethods.length
    });
  }

  /**
   * Register a degradation handler for a specific operation type
   */
  public registerDegradationHandler(operationType: string, handler: () => Promise<any>): void {
    this.degradationHandlers.set(operationType, handler);
    logSystemEvent('DEGRADATION_HANDLER_REGISTERED', {
      operationType,
      totalHandlers: this.degradationHandlers.size
    });
  }

  /**
   * Abort a specific operation
   */
  public abortOperation(operationId: string): boolean {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
      
      logSystemEvent('OPERATION_ABORTED', { operationId });
      return true;
    }
    return false;
  }

  /**
   * Abort all active operations
   */
  public abortAllOperations(): void {
    const operationIds = Array.from(this.activeOperations.keys());
    
    for (const [operationId, controller] of this.activeOperations) {
      controller.abort();
    }
    
    this.activeOperations.clear();
    
    logSystemEvent('ALL_OPERATIONS_ABORTED', {
      abortedOperations: operationIds
    });
  }

  // Private helper methods

  private initializeFallbackMethods(): void {
    // Register default fallback authentication methods
    
    // Method 1: Try to restore from minimal user data
    this.registerFallbackAuthMethod(async () => {
      const minimalUser = localStorage.getItem('auth.user.minimal');
      if (minimalUser) {
        const userData = JSON.parse(minimalUser);
        return {
          user: userData,
          source: 'minimal_restore',
          limited: true
        };
      }
      return null;
    });

    // Method 2: Try anonymous/guest access
    this.registerFallbackAuthMethod(async () => {
      return {
        user: {
          _id: 'guest',
          email: 'guest@local',
          role: 'guest',
          isGuest: true
        },
        source: 'guest_access',
        limited: true
      };
    });
  }

  private initializeDegradationHandlers(): void {
    // Register default degradation handlers
    
    this.registerDegradationHandler('auth', async () => ({
      user: null,
      isAuthenticated: false,
      message: 'Authentication service unavailable'
    }));

    this.registerDegradationHandler('database', async () => ({
      data: [],
      message: 'Database service unavailable'
    }));

    this.registerDegradationHandler('ui', async () => ({
      component: 'ErrorBoundary',
      message: 'UI component failed to load'
    }));
  }

  private async retryLastFailedOperation(operationType: string): Promise<RecoveryResult> {
    // This would need to be implemented based on application-specific logic
    // For now, return a placeholder
    return {
      success: false,
      error: new Error('Retry not implemented for this operation type'),
      recoveryMethod: 'user_initiated',
      attemptsUsed: 1,
      fallbackUsed: false,
      offlineMode: false,
    };
  }

  private async refreshAuthenticationState(): Promise<RecoveryResult> {
    try {
      const user = await getCurrentUser();
      
      logAuthEvent('USER_RECOVERY_AUTH_REFRESH_SUCCESS', {
        userId: user._id
      });

      return {
        success: true,
        data: { user },
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }

  private async resetApplicationState(): Promise<RecoveryResult> {
    try {
      // Clear all application state
      sessionStorage.clear();
      
      // Keep only essential localStorage items
      const essentialKeys = ['theme', 'language', 'user_preferences'];
      const toKeep: Record<string, string> = {};
      
      essentialKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          toKeep[key] = value;
        }
      });
      
      localStorage.clear();
      
      // Restore essential items
      Object.entries(toKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      logSystemEvent('USER_RECOVERY_STATE_RESET_SUCCESS');

      return {
        success: true,
        data: { message: 'Application state reset successfully' },
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }

  private async clearAllCaches(): Promise<RecoveryResult> {
    try {
      // Clear network cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear application caches
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('cache') || key.includes('cached')
      );
      
      cacheKeys.forEach(key => localStorage.removeItem(key));

      logSystemEvent('USER_RECOVERY_CACHE_CLEAR_SUCCESS', {
        clearedKeys: cacheKeys.length
      });

      return {
        success: true,
        data: { message: 'All caches cleared successfully' },
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }

  private async forceLogout(): Promise<RecoveryResult> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all authentication data
      clearAccessToken();
      localStorage.clear();
      sessionStorage.clear();

      logAuthEvent('USER_RECOVERY_FORCE_LOGOUT_SUCCESS');

      return {
        success: true,
        data: { message: 'Forced logout completed successfully' },
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery statistics
   */
  public getRecoveryStats(): {
    activeOperations: number;
    registeredFallbackMethods: number;
    registeredDegradationHandlers: number;
  } {
    return {
      activeOperations: this.activeOperations.size,
      registeredFallbackMethods: this.fallbackAuthMethods.length,
      registeredDegradationHandlers: this.degradationHandlers.size,
    };
  }

  /**
   * Update recovery configuration
   */
  public updateConfig(
    options?: Partial<RecoveryOptions>,
    retryConfigs?: Partial<Record<string, RetryConfig>>
  ): void {
    if (options) {
      this.recoveryOptions = { ...this.recoveryOptions, ...options };
    }
    
    if (retryConfigs) {
      this.retryConfigs = { ...this.retryConfigs, ...retryConfigs };
    }

    logSystemEvent('RECOVERY_CONFIG_UPDATED', {
      options,
      retryConfigs
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.abortAllOperations();
    this.fallbackAuthMethods.length = 0;
    this.degradationHandlers.clear();
    
    logSystemEvent('ERROR_RECOVERY_MANAGER_DESTROYED');
  }
}

// Create singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();

// Export convenience functions
export const executeWithRecovery = <T>(
  operation: () => Promise<T>,
  context: OperationContext,
  customConfig?: Partial<RetryConfig>,
  customOptions?: Partial<RecoveryOptions>
) => errorRecoveryManager.executeWithRecovery(operation, context, customConfig, customOptions);

export const initiateUserRecovery = (
  operationType: string,
  recoveryAction: 'retry' | 'refresh' | 'reset' | 'clear_cache' | 'force_logout'
) => errorRecoveryManager.initiateUserRecovery(operationType, recoveryAction);

export const registerFallbackAuthMethod = (method: () => Promise<any>) =>
  errorRecoveryManager.registerFallbackAuthMethod(method);

export const registerDegradationHandler = (operationType: string, handler: () => Promise<any>) =>
  errorRecoveryManager.registerDegradationHandler(operationType, handler);

export const abortOperation = (operationId: string) =>
  errorRecoveryManager.abortOperation(operationId);

export const abortAllOperations = () =>
  errorRecoveryManager.abortAllOperations();

export const getRecoveryStats = () =>
  errorRecoveryManager.getRecoveryStats();

export const updateRecoveryConfig = (
  options?: Partial<RecoveryOptions>,
  retryConfigs?: Partial<Record<string, RetryConfig>>
) => errorRecoveryManager.updateConfig(options, retryConfigs);

// Export types for external use
export type {
  RetryConfig,
  RecoveryOptions,
  RecoveryResult,
  OperationContext
};