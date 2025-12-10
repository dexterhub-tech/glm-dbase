/**
 * Service Unavailability Handler
 * 
 * Provides graceful degradation strategies when services become unavailable,
 * including fallback data sources, offline mode, and reduced functionality.
 * 
 * Requirements: 4.3
 */

import { 
  executeWithRecovery,
  registerDegradationHandler,
  type RecoveryResult,
  type OperationContext
} from '@/utils/errorRecovery';
import { 
  getCachedAuthState,
  cacheAuthState,
  getNetworkState
} from '@/utils/networkConnectivity';
import { logSystemEvent, logNetworkEvent } from '@/utils/comprehensiveLogging';

export interface ServiceStatus {
  serviceName: string;
  isAvailable: boolean;
  lastChecked: Date;
  lastAvailable: Date | null;
  consecutiveFailures: number;
  degradationLevel: 'none' | 'partial' | 'full';
  fallbackStrategy: 'cache' | 'offline' | 'minimal' | 'disabled';
}

export interface DegradationStrategy {
  serviceName: string;
  strategy: 'cache' | 'offline' | 'minimal' | 'disabled';
  fallbackData?: any;
  fallbackFunction?: () => Promise<any>;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface ServiceUnavailabilityOptions {
  enableAutoDetection: boolean;
  checkInterval: number;
  maxConsecutiveFailures: number;
  degradationThreshold: number;
  enableCaching: boolean;
  enableOfflineMode: boolean;
}

class ServiceUnavailabilityHandler {
  private serviceStatuses = new Map<string, ServiceStatus>();
  private degradationStrategies = new Map<string, DegradationStrategy>();
  private checkIntervals = new Map<string, NodeJS.Timeout>();
  private options: ServiceUnavailabilityOptions;

  constructor(options: Partial<ServiceUnavailabilityOptions> = {}) {
    this.options = {
      enableAutoDetection: true,
      checkInterval: 30000, // 30 seconds
      maxConsecutiveFailures: 3,
      degradationThreshold: 2,
      enableCaching: true,
      enableOfflineMode: true,
      ...options
    };

    this.initializeDefaultStrategies();
  }

  /**
   * Register a service for monitoring
   */
  public registerService(
    serviceName: string,
    healthCheckFn: () => Promise<boolean>,
    strategy?: DegradationStrategy
  ): void {
    // Initialize service status
    this.serviceStatuses.set(serviceName, {
      serviceName,
      isAvailable: true,
      lastChecked: new Date(),
      lastAvailable: new Date(),
      consecutiveFailures: 0,
      degradationLevel: 'none',
      fallbackStrategy: strategy?.strategy || 'cache',
    });

    // Register degradation strategy if provided
    if (strategy) {
      this.degradationStrategies.set(serviceName, strategy);
    }

    // Start health checking if auto-detection is enabled
    if (this.options.enableAutoDetection) {
      this.startHealthChecking(serviceName, healthCheckFn);
    }

    logSystemEvent('SERVICE_REGISTERED_FOR_MONITORING', {
      serviceName,
      strategy: strategy?.strategy,
      autoDetection: this.options.enableAutoDetection
    });
  }

  /**
   * Execute operation with service unavailability handling
   */
  public async executeWithServiceHandling<T>(
    serviceName: string,
    operation: () => Promise<T>,
    operationId?: string
  ): Promise<RecoveryResult<T>> {
    const opId = operationId || `service_${serviceName}_${Date.now()}`;
    const serviceStatus = this.serviceStatuses.get(serviceName);

    logSystemEvent('SERVICE_OPERATION_START', {
      serviceName,
      operationId: opId,
      serviceAvailable: serviceStatus?.isAvailable,
      degradationLevel: serviceStatus?.degradationLevel
    });

    // If service is known to be unavailable, try degradation immediately
    if (serviceStatus && !serviceStatus.isAvailable) {
      const degradationResult = await this.tryServiceDegradation(serviceName, opId);
      if (degradationResult.success) {
        return degradationResult;
      }
    }

    // Try the operation with recovery
    const context: OperationContext = {
      operationId: opId,
      operationType: 'system',
      metadata: {
        serviceName,
        serviceStatus: serviceStatus?.isAvailable,
        degradationLevel: serviceStatus?.degradationLevel,
      }
    };

    const result = await executeWithRecovery(
      operation,
      context,
      {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: ['network', 'timeout', 'connection', 'temporary'],
      },
      {
        enableAutoRetry: true,
        enableFallbackAuth: false,
        enableOfflineMode: this.options.enableOfflineMode,
        enableGracefulDegradation: true,
        userInitiatedRecovery: false,
      }
    );

    // Update service status based on result
    if (result.success) {
      this.markServiceAvailable(serviceName);
    } else {
      this.markServiceUnavailable(serviceName);
      
      // Try degradation if operation failed
      const degradationResult = await this.tryServiceDegradation(serviceName, opId);
      if (degradationResult.success) {
        return degradationResult;
      }
    }

    return result;
  }

  /**
   * Try service degradation strategies
   */
  private async tryServiceDegradation<T>(
    serviceName: string,
    operationId: string
  ): Promise<RecoveryResult<T>> {
    const strategy = this.degradationStrategies.get(serviceName);
    const serviceStatus = this.serviceStatuses.get(serviceName);

    if (!strategy || !serviceStatus) {
      return {
        success: false,
        error: new Error(`No degradation strategy found for service: ${serviceName}`),
        attemptsUsed: 0,
        fallbackUsed: false,
        offlineMode: false,
      };
    }

    logSystemEvent('SERVICE_DEGRADATION_ATTEMPT', {
      serviceName,
      operationId,
      strategy: strategy.strategy,
      degradationLevel: serviceStatus.degradationLevel
    });

    try {
      let fallbackData: any = null;

      switch (strategy.strategy) {
        case 'cache':
          fallbackData = await this.getCachedData(strategy.cacheKey || serviceName);
          break;

        case 'offline':
          fallbackData = await this.getOfflineData(serviceName);
          break;

        case 'minimal':
          fallbackData = strategy.fallbackData || await this.getMinimalData(serviceName);
          break;

        case 'disabled':
          fallbackData = { 
            disabled: true, 
            message: `${serviceName} is temporarily unavailable` 
          };
          break;

        default:
          if (strategy.fallbackFunction) {
            fallbackData = await strategy.fallbackFunction();
          }
      }

      if (fallbackData !== null) {
        logSystemEvent('SERVICE_DEGRADATION_SUCCESS', {
          serviceName,
          operationId,
          strategy: strategy.strategy,
          hasFallbackData: !!fallbackData
        });

        return {
          success: true,
          data: fallbackData,
          recoveryMethod: 'degraded',
          attemptsUsed: 1,
          fallbackUsed: true,
          offlineMode: strategy.strategy === 'offline',
        };
      }

      throw new Error(`No fallback data available for strategy: ${strategy.strategy}`);

    } catch (error) {
      logSystemEvent('SERVICE_DEGRADATION_FAILED', {
        serviceName,
        operationId,
        strategy: strategy.strategy,
        error: (error as Error).message
      }, error);

      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'degraded',
        attemptsUsed: 1,
        fallbackUsed: true,
        offlineMode: false,
      };
    }
  }

  /**
   * Mark service as available
   */
  private markServiceAvailable(serviceName: string): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      const wasUnavailable = !status.isAvailable;
      
      status.isAvailable = true;
      status.lastAvailable = new Date();
      status.lastChecked = new Date();
      status.consecutiveFailures = 0;
      status.degradationLevel = 'none';

      if (wasUnavailable) {
        logSystemEvent('SERVICE_RESTORED', {
          serviceName,
          downtime: status.lastAvailable.getTime() - (status.lastAvailable?.getTime() || 0)
        });
      }
    }
  }

  /**
   * Mark service as unavailable
   */
  private markServiceUnavailable(serviceName: string): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.isAvailable = false;
      status.lastChecked = new Date();
      status.consecutiveFailures += 1;

      // Update degradation level based on consecutive failures
      if (status.consecutiveFailures >= this.options.maxConsecutiveFailures) {
        status.degradationLevel = 'full';
        status.fallbackStrategy = 'offline';
      } else if (status.consecutiveFailures >= this.options.degradationThreshold) {
        status.degradationLevel = 'partial';
        status.fallbackStrategy = 'cache';
      }

      logSystemEvent('SERVICE_MARKED_UNAVAILABLE', {
        serviceName,
        consecutiveFailures: status.consecutiveFailures,
        degradationLevel: status.degradationLevel,
        fallbackStrategy: status.fallbackStrategy
      });
    }
  }

  /**
   * Start health checking for a service
   */
  private startHealthChecking(
    serviceName: string,
    healthCheckFn: () => Promise<boolean>
  ): void {
    const intervalId = setInterval(async () => {
      try {
        const isHealthy = await healthCheckFn();
        
        if (isHealthy) {
          this.markServiceAvailable(serviceName);
        } else {
          this.markServiceUnavailable(serviceName);
        }
      } catch (error) {
        logSystemEvent('SERVICE_HEALTH_CHECK_ERROR', {
          serviceName,
          error: (error as Error).message
        }, error);
        
        this.markServiceUnavailable(serviceName);
      }
    }, this.options.checkInterval);

    this.checkIntervals.set(serviceName, intervalId);

    logSystemEvent('SERVICE_HEALTH_CHECKING_STARTED', {
      serviceName,
      checkInterval: this.options.checkInterval
    });
  }

  /**
   * Stop health checking for a service
   */
  public stopHealthChecking(serviceName: string): void {
    const intervalId = this.checkIntervals.get(serviceName);
    if (intervalId) {
      clearInterval(intervalId);
      this.checkIntervals.delete(serviceName);
      
      logSystemEvent('SERVICE_HEALTH_CHECKING_STOPPED', { serviceName });
    }
  }

  /**
   * Get cached data for a service
   */
  private async getCachedData(cacheKey: string): Promise<any> {
    try {
      const cached = localStorage.getItem(`service_cache_${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid (default 5 minutes)
        if (parsed.timestamp && (now - parsed.timestamp) < 5 * 60 * 1000) {
          logSystemEvent('SERVICE_CACHE_HIT', {
            cacheKey,
            age: now - parsed.timestamp
          });
          
          return {
            ...parsed.data,
            cached: true,
            cacheAge: now - parsed.timestamp
          };
        }
      }
    } catch (error) {
      logSystemEvent('SERVICE_CACHE_ERROR', { cacheKey }, error);
    }
    
    return null;
  }

  /**
   * Get offline data for a service
   */
  private async getOfflineData(serviceName: string): Promise<any> {
    // Try to get cached auth state for auth services
    if (serviceName.includes('auth')) {
      const cachedAuth = getCachedAuthState();
      if (cachedAuth) {
        return {
          ...cachedAuth,
          offline: true,
          message: 'Using cached authentication data'
        };
      }
    }

    // Try to get any cached data
    const cachedData = await this.getCachedData(serviceName);
    if (cachedData) {
      return {
        ...cachedData,
        offline: true,
        message: 'Operating in offline mode'
      };
    }

    return {
      offline: true,
      message: `${serviceName} is unavailable - operating in offline mode`,
      data: []
    };
  }

  /**
   * Get minimal data for a service
   */
  private async getMinimalData(serviceName: string): Promise<any> {
    return {
      minimal: true,
      message: `${serviceName} is unavailable - showing minimal interface`,
      data: [],
      features: ['basic_view']
    };
  }

  /**
   * Cache data for a service
   */
  public cacheServiceData(serviceName: string, data: any, ttl: number = 5 * 60 * 1000): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
        serviceName
      };

      localStorage.setItem(`service_cache_${serviceName}`, JSON.stringify(cacheData));
      
      logSystemEvent('SERVICE_DATA_CACHED', {
        serviceName,
        ttl,
        dataSize: JSON.stringify(data).length
      });
    } catch (error) {
      logSystemEvent('SERVICE_CACHE_WRITE_ERROR', { serviceName }, error);
    }
  }

  /**
   * Get service status
   */
  public getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  /**
   * Get all service statuses
   */
  public getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Force service status update
   */
  public async checkServiceHealth(serviceName: string): Promise<boolean> {
    const strategy = this.degradationStrategies.get(serviceName);
    if (!strategy) {
      return false;
    }

    try {
      // Perform a basic connectivity test
      const networkState = getNetworkState();
      if (!networkState.isOnline) {
        this.markServiceUnavailable(serviceName);
        return false;
      }

      // For now, assume service is available if network is online
      // In a real implementation, this would make an actual health check request
      this.markServiceAvailable(serviceName);
      return true;
    } catch (error) {
      this.markServiceUnavailable(serviceName);
      return false;
    }
  }

  /**
   * Initialize default degradation strategies
   */
  private initializeDefaultStrategies(): void {
    // Register default degradation handlers
    registerDegradationHandler('auth', async () => ({
      user: null,
      isAuthenticated: false,
      message: 'Authentication service unavailable'
    }));

    registerDegradationHandler('database', async () => ({
      data: [],
      message: 'Database service unavailable - showing cached data'
    }));

    registerDegradationHandler('network', async () => ({
      offline: true,
      message: 'Network unavailable - operating in offline mode'
    }));

    logSystemEvent('DEFAULT_DEGRADATION_STRATEGIES_INITIALIZED');
  }

  /**
   * Update configuration
   */
  public updateOptions(newOptions: Partial<ServiceUnavailabilityOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    logSystemEvent('SERVICE_UNAVAILABILITY_CONFIG_UPDATED', {
      newOptions
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Stop all health checking intervals
    for (const [serviceName, intervalId] of this.checkIntervals) {
      clearInterval(intervalId);
    }
    
    this.checkIntervals.clear();
    this.serviceStatuses.clear();
    this.degradationStrategies.clear();
    
    logSystemEvent('SERVICE_UNAVAILABILITY_HANDLER_DESTROYED');
  }
}

// Create singleton instance
export const serviceUnavailabilityHandler = new ServiceUnavailabilityHandler();

// Export convenience functions
export const registerService = (
  serviceName: string,
  healthCheckFn: () => Promise<boolean>,
  strategy?: DegradationStrategy
) => serviceUnavailabilityHandler.registerService(serviceName, healthCheckFn, strategy);

export const executeWithServiceHandling = <T>(
  serviceName: string,
  operation: () => Promise<T>,
  operationId?: string
) => serviceUnavailabilityHandler.executeWithServiceHandling(serviceName, operation, operationId);

export const cacheServiceData = (serviceName: string, data: any, ttl?: number) =>
  serviceUnavailabilityHandler.cacheServiceData(serviceName, data, ttl);

export const getServiceStatus = (serviceName: string) =>
  serviceUnavailabilityHandler.getServiceStatus(serviceName);

export const getAllServiceStatuses = () =>
  serviceUnavailabilityHandler.getAllServiceStatuses();

export const checkServiceHealth = (serviceName: string) =>
  serviceUnavailabilityHandler.checkServiceHealth(serviceName);

// Export types
export type {
  DegradationStrategy,
  ServiceUnavailabilityOptions
};