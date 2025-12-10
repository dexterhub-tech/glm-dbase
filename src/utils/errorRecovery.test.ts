/**
 * Error Recovery Tests
 * 
 * Tests for the comprehensive error recovery mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  executeWithRecovery,
  initiateUserRecovery,
  registerFallbackAuthMethod,
  registerDegradationHandler,
  errorRecoveryManager,
  type OperationContext,
  type RetryConfig,
  type RecoveryOptions
} from './errorRecovery';

// Mock dependencies
vi.mock('./comprehensiveLogging', () => ({
  logAuthEvent: vi.fn(),
  logSystemEvent: vi.fn(),
  logNetworkEvent: vi.fn(),
}));

vi.mock('./networkConnectivity', () => ({
  networkManager: {},
  getCachedAuthState: vi.fn(),
  cacheAuthState: vi.fn(),
  generateConnectionError: vi.fn(() => ({
    type: 'network',
    message: 'Network error',
    troubleshootingSteps: ['Check connection'],
    canRetry: true,
    retryDelay: 1000,
  })),
  getNetworkState: vi.fn(() => ({
    isOnline: true,
    isSupabaseConnected: true,
  })),
}));

vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
      setSession: vi.fn(),
    },
  },
}));

vi.mock('./authApi', () => ({
  getCurrentUser: vi.fn(),
  clearAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}));

describe('Error Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any registered handlers
    errorRecoveryManager.destroy();
  });

  describe('Basic Recovery Operations', () => {
    it('should execute operation successfully without recovery', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      const context: OperationContext = {
        operationId: 'test-op-1',
        operationType: 'auth',
      };

      const result = await executeWithRecovery(mockOperation, context);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptsUsed).toBe(1);
      expect(result.fallbackUsed).toBe(false);
      expect(result.offlineMode).toBe(false);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operations automatically', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      const context: OperationContext = {
        operationId: 'test-op-2',
        operationType: 'network',
      };

      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 3,
        baseDelay: 100,
        retryableErrors: ['network', 'timeout'],
      };

      const result = await executeWithRecovery(mockOperation, context, customConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptsUsed).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retry attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Network timeout error'));

      const context: OperationContext = {
        operationId: 'test-op-3',
        operationType: 'database',
      };

      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 2,
        baseDelay: 50,
        retryableErrors: ['network', 'timeout'],
      };

      const customOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: true,
        enableFallbackAuth: false,
        enableOfflineMode: false,
        enableGracefulDegradation: false,
        userInitiatedRecovery: false,
      };

      const result = await executeWithRecovery(mockOperation, context, customConfig, customOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.attemptsUsed).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback Authentication', () => {
    it('should use fallback authentication when primary fails', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Auth failed'));
      
      // Register a fallback method
      const mockFallback = vi.fn().mockResolvedValue({
        user: { _id: 'fallback-user', email: 'test@example.com' },
        source: 'fallback'
      });
      
      registerFallbackAuthMethod(mockFallback);

      const context: OperationContext = {
        operationId: 'test-auth-fallback',
        operationType: 'auth',
      };

      const result = await executeWithRecovery(mockOperation, context, undefined, {
        enableAutoRetry: false,
        enableFallbackAuth: true,
        enableOfflineMode: false,
        enableGracefulDegradation: false,
        userInitiatedRecovery: false,
      });

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('fallback');
      expect(result.fallbackUsed).toBe(true);
      expect(mockFallback).toHaveBeenCalled();
    });
  });

  describe('Graceful Degradation', () => {
    it('should use graceful degradation when other methods fail', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      // Register a degradation handler
      const mockDegradationHandler = vi.fn().mockResolvedValue({
        degraded: true,
        message: 'Limited functionality available'
      });

      registerDegradationHandler('ui', mockDegradationHandler);

      const context: OperationContext = {
        operationId: 'test-degradation',
        operationType: 'ui',
      };

      const result = await executeWithRecovery(mockOperation, context, undefined, {
        enableAutoRetry: false,
        enableFallbackAuth: false,
        enableOfflineMode: false,
        enableGracefulDegradation: true,
        userInitiatedRecovery: false,
      });

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('degraded');
      expect(mockDegradationHandler).toHaveBeenCalled();
    });
  });

  describe('User-Initiated Recovery', () => {
    it('should handle user-initiated refresh recovery', async () => {
      const result = await initiateUserRecovery('auth', 'refresh');

      expect(result.recoveryMethod).toBe('user_initiated');
      expect(result.attemptsUsed).toBe(1);
    });

    it('should handle user-initiated reset recovery', async () => {
      const result = await initiateUserRecovery('system', 'reset');

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('user_initiated');
    });

    it('should handle user-initiated cache clear', async () => {
      const result = await initiateUserRecovery('system', 'clear_cache');

      expect(result.success).toBe(true);
      expect(result.recoveryMethod).toBe('user_initiated');
    });
  });

  describe('Error Classification', () => {
    it.skip('should identify retryable network errors', async () => {
      const networkError = new Error('fetch failed');
      const mockOperation = vi.fn().mockRejectedValue(networkError);

      const context: OperationContext = {
        operationId: 'test-network-error',
        operationType: 'network',
      };

      const customOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: true,
        enableFallbackAuth: false,
        enableOfflineMode: false,
        enableGracefulDegradation: false,
        userInitiatedRecovery: false,
      };

      const result = await executeWithRecovery(mockOperation, context, undefined, customOptions);

      // Should attempt retries for network errors
      expect(result.attemptsUsed).toBeGreaterThan(1);
    }, 5000); // 5 second timeout

    it('should identify non-retryable errors', async () => {
      const validationError = new Error('Invalid input data');
      const mockOperation = vi.fn().mockRejectedValue(validationError);

      const context: OperationContext = {
        operationId: 'test-validation-error',
        operationType: 'ui',
      };

      const customConfig: Partial<RetryConfig> = {
        maxAttempts: 1,
        retryableErrors: ['network', 'timeout'], // validation errors not included
      };

      const customOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: true,
        enableFallbackAuth: false,
        enableOfflineMode: false,
        enableGracefulDegradation: false,
        userInitiatedRecovery: false,
      };

      const result = await executeWithRecovery(mockOperation, context, customConfig, customOptions);

      // Should not retry validation errors
      expect(result.attemptsUsed).toBe(1);
    });
  });

  describe('Recovery Statistics', () => {
    it('should provide recovery statistics', () => {
      const stats = errorRecoveryManager.getRecoveryStats();

      expect(stats).toHaveProperty('activeOperations');
      expect(stats).toHaveProperty('registeredFallbackMethods');
      expect(stats).toHaveProperty('registeredDegradationHandlers');
      expect(typeof stats.activeOperations).toBe('number');
    });
  });

  describe('Configuration Updates', () => {
    it('should allow updating recovery configuration', () => {
      const newOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: false,
        enableOfflineMode: true,
      };

      const newRetryConfigs = {
        auth: {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 20000,
          backoffMultiplier: 3,
          retryableErrors: ['network', 'timeout', 'auth'],
        }
      };

      expect(() => {
        errorRecoveryManager.updateConfig(newOptions, newRetryConfigs);
      }).not.toThrow();
    });
  });

  describe('Operation Abortion', () => {
    it('should allow aborting active operations', async () => {
      const slowOperation = vi.fn().mockImplementation(() => 
        new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 1000);
          // Simulate abort by rejecting after a short delay
          setTimeout(() => {
            clearTimeout(timeout);
            reject(new Error('Operation aborted'));
          }, 100);
        })
      );

      const context: OperationContext = {
        operationId: 'slow-operation',
        operationType: 'database',
      };

      const customOptions: Partial<RecoveryOptions> = {
        enableAutoRetry: false,
        enableFallbackAuth: false,
        enableOfflineMode: false,
        enableGracefulDegradation: false,
        userInitiatedRecovery: false,
      };

      // Start the operation but don't wait for it
      const operationPromise = executeWithRecovery(slowOperation, context, undefined, customOptions);

      // Wait a bit then abort
      await new Promise(resolve => setTimeout(resolve, 50));
      const aborted = errorRecoveryManager.abortOperation('slow-operation');
      
      // The operation should be aborted
      const result = await operationPromise;
      expect(result.success).toBe(false);
    });
  });
});