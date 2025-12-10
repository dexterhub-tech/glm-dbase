/**
 * React Hook for Error Recovery
 * 
 * Provides easy access to error recovery mechanisms from React components
 * with state management and user interaction handling.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  executeWithRecovery,
  initiateUserRecovery,
  registerFallbackAuthMethod,
  registerDegradationHandler,
  abortOperation,
  getRecoveryStats,
  type RecoveryResult,
  type OperationContext,
  type RetryConfig,
  type RecoveryOptions
} from '@/utils/errorRecovery';
import { logUIEvent } from '@/utils/comprehensiveLogging';

export interface UseErrorRecoveryOptions {
  operationType: 'auth' | 'database' | 'network' | 'ui' | 'system';
  autoRetry?: boolean;
  enableFallback?: boolean;
  enableOfflineMode?: boolean;
  enableGracefulDegradation?: boolean;
  onRecoveryAttempt?: (method: string) => void;
  onRecoverySuccess?: (result: RecoveryResult) => void;
  onRecoveryFailure?: (error: Error) => void;
}

export interface ErrorRecoveryState {
  isRecovering: boolean;
  lastError: Error | null;
  recoveryMethod: string | null;
  attemptsUsed: number;
  canRetry: boolean;
  isOffline: boolean;
  isDegraded: boolean;
}

export interface RecoveryActions {
  executeWithRecovery: <T>(
    operation: () => Promise<T>,
    operationId?: string,
    customConfig?: Partial<RetryConfig>
  ) => Promise<RecoveryResult<T>>;
  
  retryLastOperation: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  resetState: () => Promise<void>;
  clearCaches: () => Promise<void>;
  forceLogout: () => Promise<void>;
  
  registerFallback: (method: () => Promise<any>) => void;
  registerDegradation: (handler: () => Promise<any>) => void;
  
  clearError: () => void;
  abortCurrentOperation: () => void;
}

export function useErrorRecovery(options: UseErrorRecoveryOptions) {
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    lastError: null,
    recoveryMethod: null,
    attemptsUsed: 0,
    canRetry: false,
    isOffline: false,
    isDegraded: false,
  });

  const currentOperationRef = useRef<string | null>(null);
  const operationCounterRef = useRef(0);

  // Generate unique operation ID
  const generateOperationId = useCallback(() => {
    operationCounterRef.current += 1;
    return `${options.operationType}_${Date.now()}_${operationCounterRef.current}`;
  }, [options.operationType]);

  // Update state helper
  const updateState = useCallback((updates: Partial<ErrorRecoveryState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Execute operation with recovery
  const executeWithRecoveryWrapper = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId?: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RecoveryResult<T>> => {
    const opId = operationId || generateOperationId();
    currentOperationRef.current = opId;

    logUIEvent('ERROR_RECOVERY_OPERATION_START', 'useErrorRecovery', {
      operationId: opId,
      operationType: options.operationType
    });

    updateState({
      isRecovering: true,
      lastError: null,
      recoveryMethod: null,
      attemptsUsed: 0,
      canRetry: false,
      isOffline: false,
      isDegraded: false,
    });

    try {
      const context: OperationContext = {
        operationId: opId,
        operationType: options.operationType,
        metadata: {
          component: 'useErrorRecovery',
          timestamp: new Date().toISOString(),
        }
      };

      const recoveryOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: options.autoRetry,
        enableFallbackAuth: options.enableFallback,
        enableOfflineMode: options.enableOfflineMode,
        enableGracefulDegradation: options.enableGracefulDegradation,
      };

      // Notify about recovery attempt
      if (options.onRecoveryAttempt) {
        options.onRecoveryAttempt('primary');
      }

      const result = await executeWithRecovery(
        operation,
        context,
        customConfig,
        recoveryOptions
      );

      // Update state based on result
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
        attemptsUsed: result.attemptsUsed,
        canRetry: !result.success && result.attemptsUsed < 5, // Allow retry if not too many attempts
        isOffline: result.offlineMode,
        isDegraded: result.recoveryMethod === 'degraded',
      });

      if (result.success) {
        logUIEvent('ERROR_RECOVERY_OPERATION_SUCCESS', 'useErrorRecovery', {
          operationId: opId,
          recoveryMethod: result.recoveryMethod,
          attemptsUsed: result.attemptsUsed
        });

        if (options.onRecoverySuccess) {
          options.onRecoverySuccess(result);
        }
      } else {
        logUIEvent('ERROR_RECOVERY_OPERATION_FAILED', 'useErrorRecovery', {
          operationId: opId,
          error: result.error?.message,
          attemptsUsed: result.attemptsUsed
        });

        if (options.onRecoveryFailure && result.error) {
          options.onRecoveryFailure(result.error);
        }
      }

      return result;

    } catch (error) {
      const err = error as Error;
      
      updateState({
        isRecovering: false,
        lastError: err,
        canRetry: true,
      });

      logUIEvent('ERROR_RECOVERY_OPERATION_EXCEPTION', 'useErrorRecovery', {
        operationId: opId,
        error: err.message
      }, err);

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }

      return {
        success: false,
        error: err,
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    } finally {
      currentOperationRef.current = null;
    }
  }, [
    options.operationType,
    options.autoRetry,
    options.enableFallback,
    options.enableOfflineMode,
    options.enableGracefulDegradation,
    options.onRecoveryAttempt,
    options.onRecoverySuccess,
    options.onRecoveryFailure,
    generateOperationId,
    updateState
  ]);

  // User-initiated recovery actions
  const retryLastOperation = useCallback(async () => {
    if (!state.canRetry) return;

    logUIEvent('USER_INITIATED_RETRY', 'useErrorRecovery', {
      operationType: options.operationType
    });

    updateState({ isRecovering: true });

    try {
      const result = await initiateUserRecovery(options.operationType, 'retry');
      
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
        attemptsUsed: result.attemptsUsed,
        canRetry: !result.success,
      });

      if (result.success && options.onRecoverySuccess) {
        options.onRecoverySuccess(result);
      } else if (result.error && options.onRecoveryFailure) {
        options.onRecoveryFailure(result.error);
      }
    } catch (error) {
      const err = error as Error;
      updateState({
        isRecovering: false,
        lastError: err,
        canRetry: true,
      });

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }
    }
  }, [state.canRetry, options.operationType, options.onRecoverySuccess, options.onRecoveryFailure, updateState]);

  const refreshAuth = useCallback(async () => {
    logUIEvent('USER_INITIATED_AUTH_REFRESH', 'useErrorRecovery');

    updateState({ isRecovering: true });

    try {
      const result = await initiateUserRecovery(options.operationType, 'refresh');
      
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
      });

      if (result.success && options.onRecoverySuccess) {
        options.onRecoverySuccess(result);
      } else if (result.error && options.onRecoveryFailure) {
        options.onRecoveryFailure(result.error);
      }
    } catch (error) {
      const err = error as Error;
      updateState({
        isRecovering: false,
        lastError: err,
      });

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }
    }
  }, [options.operationType, options.onRecoverySuccess, options.onRecoveryFailure, updateState]);

  const resetState = useCallback(async () => {
    logUIEvent('USER_INITIATED_STATE_RESET', 'useErrorRecovery');

    updateState({ isRecovering: true });

    try {
      const result = await initiateUserRecovery(options.operationType, 'reset');
      
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
      });

      if (result.success && options.onRecoverySuccess) {
        options.onRecoverySuccess(result);
      } else if (result.error && options.onRecoveryFailure) {
        options.onRecoveryFailure(result.error);
      }
    } catch (error) {
      const err = error as Error;
      updateState({
        isRecovering: false,
        lastError: err,
      });

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }
    }
  }, [options.operationType, options.onRecoverySuccess, options.onRecoveryFailure, updateState]);

  const clearCaches = useCallback(async () => {
    logUIEvent('USER_INITIATED_CACHE_CLEAR', 'useErrorRecovery');

    updateState({ isRecovering: true });

    try {
      const result = await initiateUserRecovery(options.operationType, 'clear_cache');
      
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
      });

      if (result.success && options.onRecoverySuccess) {
        options.onRecoverySuccess(result);
      } else if (result.error && options.onRecoveryFailure) {
        options.onRecoveryFailure(result.error);
      }
    } catch (error) {
      const err = error as Error;
      updateState({
        isRecovering: false,
        lastError: err,
      });

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }
    }
  }, [options.operationType, options.onRecoverySuccess, options.onRecoveryFailure, updateState]);

  const forceLogout = useCallback(async () => {
    logUIEvent('USER_INITIATED_FORCE_LOGOUT', 'useErrorRecovery');

    updateState({ isRecovering: true });

    try {
      const result = await initiateUserRecovery(options.operationType, 'force_logout');
      
      updateState({
        isRecovering: false,
        lastError: result.error || null,
        recoveryMethod: result.recoveryMethod || null,
      });

      if (result.success && options.onRecoverySuccess) {
        options.onRecoverySuccess(result);
      } else if (result.error && options.onRecoveryFailure) {
        options.onRecoveryFailure(result.error);
      }
    } catch (error) {
      const err = error as Error;
      updateState({
        isRecovering: false,
        lastError: err,
      });

      if (options.onRecoveryFailure) {
        options.onRecoveryFailure(err);
      }
    }
  }, [options.operationType, options.onRecoverySuccess, options.onRecoveryFailure, updateState]);

  // Register fallback method
  const registerFallback = useCallback((method: () => Promise<any>) => {
    registerFallbackAuthMethod(method);
    
    logUIEvent('FALLBACK_METHOD_REGISTERED', 'useErrorRecovery', {
      operationType: options.operationType
    });
  }, [options.operationType]);

  // Register degradation handler
  const registerDegradation = useCallback((handler: () => Promise<any>) => {
    registerDegradationHandler(options.operationType, handler);
    
    logUIEvent('DEGRADATION_HANDLER_REGISTERED', 'useErrorRecovery', {
      operationType: options.operationType
    });
  }, [options.operationType]);

  // Clear error state
  const clearError = useCallback(() => {
    updateState({
      lastError: null,
      recoveryMethod: null,
      canRetry: false,
    });

    logUIEvent('ERROR_STATE_CLEARED', 'useErrorRecovery');
  }, [updateState]);

  // Abort current operation
  const abortCurrentOperation = useCallback(() => {
    if (currentOperationRef.current) {
      const success = abortOperation(currentOperationRef.current);
      
      if (success) {
        updateState({
          isRecovering: false,
          lastError: new Error('Operation aborted by user'),
          canRetry: true,
        });

        logUIEvent('OPERATION_ABORTED_BY_USER', 'useErrorRecovery', {
          operationId: currentOperationRef.current
        });
      }
    }
  }, [updateState]);

  // Recovery actions object
  const actions: RecoveryActions = {
    executeWithRecovery: executeWithRecoveryWrapper,
    retryLastOperation,
    refreshAuth,
    resetState,
    clearCaches,
    forceLogout,
    registerFallback,
    registerDegradation,
    clearError,
    abortCurrentOperation,
  };

  // Get recovery statistics
  const [stats, setStats] = useState(getRecoveryStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getRecoveryStats());
    }, 5000); // Update stats every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    state,
    actions,
    stats,
  };
}

// Convenience hooks for specific operation types
export function useAuthRecovery(options?: Omit<UseErrorRecoveryOptions, 'operationType'>) {
  return useErrorRecovery({
    operationType: 'auth',
    autoRetry: true,
    enableFallback: true,
    enableOfflineMode: true,
    enableGracefulDegradation: true,
    ...options,
  });
}

export function useDatabaseRecovery(options?: Omit<UseErrorRecoveryOptions, 'operationType'>) {
  return useErrorRecovery({
    operationType: 'database',
    autoRetry: true,
    enableFallback: false,
    enableOfflineMode: true,
    enableGracefulDegradation: true,
    ...options,
  });
}

export function useNetworkRecovery(options?: Omit<UseErrorRecoveryOptions, 'operationType'>) {
  return useErrorRecovery({
    operationType: 'network',
    autoRetry: true,
    enableFallback: false,
    enableOfflineMode: true,
    enableGracefulDegradation: true,
    ...options,
  });
}

export function useUIRecovery(options?: Omit<UseErrorRecoveryOptions, 'operationType'>) {
  return useErrorRecovery({
    operationType: 'ui',
    autoRetry: false,
    enableFallback: false,
    enableOfflineMode: false,
    enableGracefulDegradation: true,
    ...options,
  });
}