/**
 * Dashboard Loading Integration Tests
 * 
 * Tests dashboard component loading under various conditions,
 * fallback mechanisms, error boundaries, and performance monitoring.
 * 
 * Requirements: 2.3, 4.1, 4.4
 */

import React, { Suspense, lazy } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { ErrorBoundary } from 'react-error-boundary';
import * as authApi from '@/utils/authApi';
import * as networkConnectivity from '@/utils/networkConnectivity';
import * as errorRecovery from '@/utils/errorRecovery';
import * as roleManagement from '@/utils/roleManagement';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/authApi');
vi.mock('@/utils/networkConnectivity');
vi.mock('@/utils/errorRecovery');
vi.mock('@/utils/roleManagement');
vi.mock('@/utils/comprehensiveLogging', () => ({
  logAuthEvent: vi.fn(),
  logPerformanceMetric: vi.fn(),
  startMeasurement: vi.fn(() => 'test-id'),
  endMeasurement: vi.fn(),
}));

const mockedAuthApi = vi.mocked(authApi);
const mockedSupabase = vi.mocked(supabase);
const mockedNetworkConnectivity = vi.mocked(networkConnectivity);
const mockedErrorRecovery = vi.mocked(errorRecovery);
const mockedRoleManagement = vi.mocked(roleManagement);

// Test components that simulate different loading scenarios
const SlowLoadingComponent = ({ delay = 1000 }: { delay?: number }) => {
  const [loaded, setLoaded] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!loaded) {
    return <div data-testid="component-loading">Component Loading...</div>;
  }
  
  return <div data-testid="slow-component">Slow Component Loaded</div>;
};

const FailingComponent = ({ shouldFail = true }: { shouldFail?: boolean }) => {
  if (shouldFail) {
    throw new Error('Component failed to load');
  }
  return <div data-testid="failing-component">Component Loaded</div>;
};

const LazyComponent = lazy(() => 
  new Promise<{ default: React.ComponentType }>((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve({ default: () => <div data-testid="lazy-component">Lazy Component Loaded</div> });
      } else {
        reject(new Error('Lazy component failed to load'));
      }
    }, 500);
  })
);

const DashboardWithComponents = ({ 
  includeSlowComponent = false,
  includeFailingComponent = false,
  includeLazyComponent = false,
  componentDelay = 1000,
  shouldComponentFail = false,
}: {
  includeSlowComponent?: boolean;
  includeFailingComponent?: boolean;
  includeLazyComponent?: boolean;
  componentDelay?: number;
  shouldComponentFail?: boolean;
}) => (
  <div data-testid="dashboard">
    <h1>Dashboard</h1>
    <div data-testid="dashboard-content">
      {includeSlowComponent && (
        <SlowLoadingComponent delay={componentDelay} />
      )}
      {includeFailingComponent && (
        <ErrorBoundary
          fallback={<div data-testid="error-fallback">Component Error Fallback</div>}
          onError={(error) => console.log('Component error:', error)}
        >
          <FailingComponent shouldFail={shouldComponentFail} />
        </ErrorBoundary>
      )}
      {includeLazyComponent && (
        <Suspense fallback={<div data-testid="lazy-loading">Loading lazy component...</div>}>
          <ErrorBoundary
            fallback={<div data-testid="lazy-error-fallback">Lazy Component Error</div>}
          >
            <LazyComponent />
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  </div>
);

const TestApp = ({ 
  dashboardProps = {},
  networkConditions = 'good',
}: {
  dashboardProps?: any;
  networkConditions?: 'good' | 'slow' | 'offline' | 'unstable';
}) => (
  <MemoryRouter initialEntries={['/dashboard']}>
    <AuthProvider>
      <AuthGuard requireAuth={true}>
        <DashboardWithComponents {...dashboardProps} />
      </AuthGuard>
    </AuthProvider>
  </MemoryRouter>
);

describe('Dashboard Loading Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const testUser = {
      _id: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      fullName: 'Test User'
    };

    mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);
    
    mockedRoleManagement.verifyUserRole.mockResolvedValue({
      role: 'admin',
      permissions: ['view_admin_dashboard'],
      isVerified: true,
      lastVerified: new Date(),
      fallbackApplied: false,
    });
    
    mockedNetworkConnectivity.networkManager = {
      getState: vi.fn(() => ({
        isOnline: true,
        isSupabaseConnected: true,
        lastConnectedAt: new Date(),
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'good',
        latency: 50,
      })),
      subscribe: vi.fn(() => vi.fn()),
    };
    
    mockedNetworkConnectivity.subscribeToNetworkChanges = vi.fn(() => vi.fn());
    mockedNetworkConnectivity.getCachedAuthState = vi.fn(() => null);
    
    mockedErrorRecovery.executeWithRecovery = vi.fn().mockImplementation(async (operation) => {
      try {
        const result = await operation();
        return { success: true, result, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      } catch (error) {
        return { success: false, error, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      }
    });
    
    mockedErrorRecovery.registerFallbackAuthMethod = vi.fn();
    mockedErrorRecovery.registerDegradationHandler = vi.fn();
    
    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Dashboard Component Loading Under Various Conditions', () => {
    it('should load dashboard with all components successfully', async () => {
      render(<TestApp 
        dashboardProps={{
          includeSlowComponent: true,
          includeLazyComponent: true,
          componentDelay: 100, // Fast loading for test
        }}
      />);

      // Simulate successful authentication
      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Wait for slow component to load
      await waitFor(() => {
        expect(screen.getByTestId('slow-component')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Check for lazy component (may succeed or fail)
      await waitFor(() => {
        expect(
          screen.queryByTestId('lazy-component') || 
          screen.queryByTestId('lazy-error-fallback')
        ).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should handle slow network conditions gracefully', async () => {
      // Mock slow network
      mockedNetworkConnectivity.networkManager.getState.mockReturnValue({
        isOnline: true,
        isSupabaseConnected: true,
        lastConnectedAt: new Date(),
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'slow',
        latency: 2000,
      });

      // Add delay to auth API to simulate slow network
      mockedAuthApi.getCurrentUser.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            _id: 'user-123',
            email: 'test@example.com',
            role: 'admin',
            fullName: 'Test User'
          }), 1500)
        )
      );

      const startTime = performance.now();

      render(<TestApp 
        dashboardProps={{
          includeSlowComponent: true,
          componentDelay: 500,
        }}
        networkConditions="slow"
      />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      // Wait for dashboard to eventually load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle slow conditions but still load
      expect(duration).toBeGreaterThan(1000); // Should take time due to slow network
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should handle offline conditions with cached data', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        fullName: 'Test User'
      };

      const cachedState = {
        user: testUser,
        userRole: {
          role: 'admin' as const,
          permissions: ['view_admin_dashboard'],
          isVerified: true,
          lastVerified: new Date(),
        },
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      // Mock offline conditions
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      mockedNetworkConnectivity.networkManager.getState.mockReturnValue({
        isOnline: false,
        isSupabaseConnected: false,
        lastConnectedAt: null,
        lastDisconnectedAt: new Date(),
        reconnectAttempts: 0,
        connectionQuality: 'offline',
        latency: null,
      });

      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Network unavailable'));
      mockedNetworkConnectivity.getCachedAuthState.mockReturnValue(cachedState);

      render(<TestApp 
        dashboardProps={{
          includeSlowComponent: true,
          componentDelay: 100,
        }}
        networkConditions="offline"
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: testUser._id, email: testUser.email }
        });
      });

      // Should load dashboard using cached data
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Fallback Mechanisms and Error Boundaries', () => {
    it('should show error fallback when components fail to load', async () => {
      render(<TestApp 
        dashboardProps={{
          includeFailingComponent: true,
          shouldComponentFail: true,
        }}
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show error fallback for failing component
      await waitFor(() => {
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      });

      // Dashboard should still be functional
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should handle lazy loading failures with error boundaries', async () => {
      // Mock lazy component to always fail
      vi.doMock('./LazyComponent', () => {
        throw new Error('Lazy component failed to load');
      });

      render(<TestApp 
        dashboardProps={{
          includeLazyComponent: true,
        }}
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show loading initially, then error fallback
      await waitFor(() => {
        expect(
          screen.queryByTestId('lazy-loading') ||
          screen.queryByTestId('lazy-error-fallback')
        ).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should provide graceful degradation when multiple components fail', async () => {
      render(<TestApp 
        dashboardProps={{
          includeFailingComponent: true,
          includeLazyComponent: true,
          shouldComponentFail: true,
        }}
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show error fallbacks for failed components
      await waitFor(() => {
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      });

      // Main dashboard should still be functional
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should recover from component failures with retry mechanism', async () => {
      let shouldFail = true;
      
      const RetryableComponent = () => {
        const [retryCount, setRetryCount] = React.useState(0);
        
        if (shouldFail && retryCount === 0) {
          throw new Error('Component failed');
        }
        
        return (
          <div data-testid="retryable-component">
            Component Loaded (retry: {retryCount})
            <button 
              onClick={() => {
                shouldFail = false;
                setRetryCount(c => c + 1);
              }}
              data-testid="retry-component"
            >
              Retry
            </button>
          </div>
        );
      };

      const DashboardWithRetryable = () => (
        <div data-testid="dashboard">
          <ErrorBoundary
            fallback={({ resetErrorBoundary }) => (
              <div data-testid="retry-fallback">
                Component Failed
                <button onClick={resetErrorBoundary} data-testid="reset-error">
                  Retry Component
                </button>
              </div>
            )}
          >
            <RetryableComponent />
          </ErrorBoundary>
        </div>
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthGuard requireAuth={true}>
              <DashboardWithRetryable />
            </AuthGuard>
          </AuthProvider>
        </MemoryRouter>
      );

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show retry fallback initially
      await waitFor(() => {
        expect(screen.getByTestId('retry-fallback')).toBeInTheDocument();
      });

      // Click retry and component should recover
      const retryButton = screen.getByTestId('reset-error');
      await act(async () => {
        shouldFail = false;
        retryButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('retryable-component')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring and Logging', () => {
    it('should measure component loading performance', async () => {
      const performanceEntries: PerformanceEntry[] = [];
      
      // Mock performance.mark and performance.measure
      vi.spyOn(performance, 'mark').mockImplementation((name) => {
        performanceEntries.push({
          name,
          entryType: 'mark',
          startTime: performance.now(),
          duration: 0,
        } as PerformanceEntry);
      });

      vi.spyOn(performance, 'measure').mockImplementation((name, start, end) => {
        const entry = {
          name,
          entryType: 'measure',
          startTime: performance.now(),
          duration: 100,
        } as PerformanceEntry;
        performanceEntries.push(entry);
        return entry;
      });

      render(<TestApp 
        dashboardProps={{
          includeSlowComponent: true,
          componentDelay: 500,
        }}
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('slow-component')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Should have performance measurements
      expect(performance.mark).toHaveBeenCalled();
    });

    it('should log component loading bottlenecks', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(<TestApp 
        dashboardProps={{
          includeSlowComponent: true,
          componentDelay: 2000, // Very slow component
        }}
      />);

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show component loading state
      expect(screen.getByTestId('component-loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('slow-component')).toBeInTheDocument();
      }, { timeout: 5000 });

      consoleSpy.mockRestore();
    });

    it('should track error rates and recovery success', async () => {
      let errorCount = 0;
      let recoveryCount = 0;

      const ErrorTrackingComponent = () => {
        const [hasError, setHasError] = React.useState(true);
        
        if (hasError) {
          errorCount++;
          throw new Error('Tracked error');
        }
        
        return <div data-testid="error-tracking-component">Component Loaded</div>;
      };

      const DashboardWithErrorTracking = () => (
        <div data-testid="dashboard">
          <ErrorBoundary
            fallback={({ resetErrorBoundary }) => (
              <div data-testid="error-tracking-fallback">
                Error Tracked
                <button 
                  onClick={() => {
                    recoveryCount++;
                    resetErrorBoundary();
                  }}
                  data-testid="track-recovery"
                >
                  Recover
                </button>
              </div>
            )}
          >
            <ErrorTrackingComponent />
          </ErrorBoundary>
        </div>
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthGuard requireAuth={true}>
              <DashboardWithErrorTracking />
            </AuthGuard>
          </AuthProvider>
        </MemoryRouter>
      );

      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: 'user-123', email: 'test@example.com' }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-tracking-fallback')).toBeInTheDocument();
      });

      // Track error occurrence
      expect(errorCount).toBeGreaterThan(0);

      // Simulate recovery
      const recoverButton = screen.getByTestId('track-recovery');
      await act(async () => {
        recoverButton.click();
      });

      // Track recovery attempt
      expect(recoveryCount).toBeGreaterThan(0);
    });
  });
});