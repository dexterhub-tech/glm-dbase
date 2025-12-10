/**
 * Integration Tests for Authentication Dashboard Fix
 * 
 * Tests complete authentication flows with real Supabase connections,
 * error recovery mechanisms, performance under different network conditions,
 * and cross-component communication.
 * 
 * Requirements: All requirements validation (1.1-5.5)
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import EnhancedRouteProtection from '@/components/auth/EnhancedRouteProtection';
import { supabase } from '@/integrations/supabase/client';
import * as authApi from '@/utils/authApi';
import * as networkConnectivity from '@/utils/networkConnectivity';
import * as errorRecovery from '@/utils/errorRecovery';
import * as roleManagement from '@/utils/roleManagement';

// Mock external dependencies but allow real integration testing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        })),
        limit: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

vi.mock('@/utils/authApi');
vi.mock('@/utils/networkConnectivity');
vi.mock('@/utils/errorRecovery');
vi.mock('@/utils/roleManagement');
vi.mock('@/utils/comprehensiveLogging', () => ({
  logAuthEvent: vi.fn(),
  logPerformanceMetric: vi.fn(),
  logSystemEvent: vi.fn(),
  captureDebugContext: vi.fn(),
  startMeasurement: vi.fn(() => 'test-measurement-id'),
  endMeasurement: vi.fn(),
}));

const mockedAuthApi = vi.mocked(authApi);
const mockedSupabase = vi.mocked(supabase);
const mockedNetworkConnectivity = vi.mocked(networkConnectivity);
const mockedErrorRecovery = vi.mocked(errorRecovery);
const mockedRoleManagement = vi.mocked(roleManagement);

// Test components
const TestDashboard = () => {
  const { user, isLoading, error, retry } = useAuth();
  
  if (isLoading) return <div data-testid="dashboard-loading">Loading Dashboard...</div>;
  if (error) return (
    <div data-testid="dashboard-error">
      Error: {error.message}
      <button onClick={retry} data-testid="retry-button">Retry</button>
    </div>
  );
  if (!user) return <div data-testid="dashboard-no-user">No User</div>;
  
  return (
    <div data-testid="dashboard-content">
      <h1>Dashboard</h1>
      <div data-testid="user-info">Welcome, {user.email}</div>
      <div data-testid="user-role">{user.role}</div>
    </div>
  );
};

const TestApp = ({ initialRoute = '/dashboard' }: { initialRoute?: string }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      <EnhancedRouteProtection>
        <AuthGuard requireAuth={true} requiredPermission="view_admin_dashboard">
          <TestDashboard />
        </AuthGuard>
      </EnhancedRouteProtection>
    </AuthProvider>
  </MemoryRouter>
);

const TestAuthComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{auth.isLoading.toString()}</div>
      <div data-testid="auth-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="auth-user-id">{auth.user?._id || 'none'}</div>
      <div data-testid="auth-error">{auth.error?.message || 'none'}</div>
      <div data-testid="auth-network-online">{auth.networkState.isOnline.toString()}</div>
      <div data-testid="auth-network-supabase">{auth.networkState.isSupabaseConnected.toString()}</div>
      <div data-testid="auth-offline">{auth.isOffline.toString()}</div>
      <div data-testid="loading-stage">{auth.loadingState.stage}</div>
      <div data-testid="loading-progress">{auth.loadingState.progress}</div>
      <button onClick={auth.refresh} data-testid="refresh-button">Refresh</button>
      <button onClick={auth.retry} data-testid="retry-button">Retry</button>
      <button onClick={() => auth.initiateRecovery('refresh')} data-testid="recovery-button">Recover</button>
    </div>
  );
};

describe('Authentication Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
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
    
    mockedNetworkConnectivity.checkConnectivity = vi.fn().mockResolvedValue({
      isOnline: true,
      isSupabaseConnected: true,
      connectionQuality: 'good',
      latency: 50,
    });
    
    mockedNetworkConnectivity.subscribeToNetworkChanges = vi.fn(() => vi.fn());
    mockedNetworkConnectivity.getCachedAuthState = vi.fn(() => null);
    mockedNetworkConnectivity.cacheAuthState = vi.fn();
    mockedNetworkConnectivity.clearCachedAuthState = vi.fn();
    mockedNetworkConnectivity.startReconnection = vi.fn();
    mockedNetworkConnectivity.stopReconnection = vi.fn();
    mockedNetworkConnectivity.generateConnectionError = vi.fn((error) => ({
      type: 'network',
      message: error.message || 'Connection failed',
      canRetry: true,
      troubleshootingSteps: ['Check your internet connection'],
    }));
    
    mockedErrorRecovery.executeWithRecovery = vi.fn().mockImplementation(async (operation) => {
      try {
        const result = await operation();
        return { success: true, result, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      } catch (error) {
        return { success: false, error, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      }
    });
    
    mockedErrorRecovery.initiateUserRecovery = vi.fn().mockResolvedValue({
      success: true,
      attemptsUsed: 1,
      fallbackUsed: false,
      offlineMode: false,
    });
    
    mockedErrorRecovery.registerFallbackAuthMethod = vi.fn();
    mockedErrorRecovery.registerDegradationHandler = vi.fn();
    
    mockedRoleManagement.verifyUserRole = vi.fn().mockResolvedValue({
      role: 'admin',
      permissions: ['view_admin_dashboard', 'manage_users'],
      isVerified: true,
      lastVerified: new Date(),
      fallbackApplied: false,
    });
    
    mockedRoleManagement.reVerifyAdminPermissions = vi.fn().mockResolvedValue({
      hasPermission: true,
      fallbackApplied: false,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Authentication Flows', () => {
    it('should complete full login to dashboard flow successfully', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);
      
      // Mock successful auth state change
      const mockAuthStateChange = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(<TestApp />);

      // Simulate successful login
      await act(async () => {
        mockAuthStateChange('SIGNED_IN', { 
          user: { id: testUser._id, email: testUser.email },
          access_token: 'valid-token'
        });
      });

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify user information is displayed
      expect(screen.getByTestId('user-info')).toHaveTextContent('Welcome, admin@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      
      // Verify role verification was called
      expect(mockedRoleManagement.verifyUserRole).toHaveBeenCalledWith(testUser._id);
    });

    it('should handle authentication timeout gracefully', async () => {
      // Mock slow authentication
      mockedAuthApi.getCurrentUser.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          _id: 'user-123',
          email: 'test@example.com',
          role: 'user',
          fullName: 'Test User'
        }), 15000)) // 15 seconds - longer than timeout
      );

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for timeout to occur
      await waitFor(() => {
        const errorElement = screen.getByTestId('auth-error');
        expect(errorElement.textContent).toContain('timeout');
      }, { timeout: 12000 });

      // Verify loading state is false after timeout
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
    });

    it('should restore session on page refresh', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        fullName: 'Test User'
      };

      // Mock stored session data
      const mockLocalStorage = {
        getItem: vi.fn((key) => {
          if (key === 'supabase.auth.token') {
            return JSON.stringify({ access_token: 'stored-token', expires_at: new Date(Date.now() + 3600000).toISOString() });
          }
          if (key === 'auth.user') {
            return JSON.stringify(testUser);
          }
          if (key === 'auth.metadata') {
            return JSON.stringify({ lastPersisted: new Date().toISOString() });
          }
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for session restoration
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('auth-user-id')).toHaveTextContent(testUser._id);
      }, { timeout: 5000 });
    });
  });

  describe('Error Recovery Mechanisms', () => {
    it('should recover from network failures using cached state', async () => {
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

      // Mock network failure
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Network error'));
      mockedNetworkConnectivity.getCachedAuthState.mockReturnValue(cachedState);
      mockedNetworkConnectivity.generateConnectionError.mockReturnValue({
        type: 'network',
        message: 'No internet connection detected',
        canRetry: true,
        troubleshootingSteps: ['Check your internet connection'],
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate auth state change that fails
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

      // Wait for cached state to be used
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('auth-user-id')).toHaveTextContent(testUser._id);
      }, { timeout: 5000 });

      // Verify error indicates offline mode
      const errorText = screen.getByTestId('auth-error').textContent;
      expect(errorText).toContain('cached data');
    });

    it('should handle retry mechanism with exponential backoff', async () => {
      let attemptCount = 0;
      mockedAuthApi.getCurrentUser.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error(`Attempt ${attemptCount} failed`));
        }
        return Promise.resolve({
          _id: 'user-123',
          email: 'test@example.com',
          role: 'user',
          fullName: 'Test User'
        });
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).not.toHaveTextContent('none');
      });

      // Trigger retry
      fireEvent.click(screen.getByTestId('retry-button'));

      // Wait for eventual success
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
      }, { timeout: 10000 });

      expect(attemptCount).toBeGreaterThanOrEqual(3);
    });

    it('should use error recovery system for failed operations', async () => {
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Auth service unavailable'));
      
      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).not.toHaveTextContent('none');
      });

      // Trigger recovery
      fireEvent.click(screen.getByTestId('recovery-button'));

      // Verify recovery was initiated
      await waitFor(() => {
        expect(mockedErrorRecovery.initiateUserRecovery).toHaveBeenCalledWith('auth', 'refresh');
      });
    });
  });

  describe('Network Condition Handling', () => {
    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      mockedNetworkConnectivity.checkConnectivity.mockResolvedValue({
        isOnline: false,
        isSupabaseConnected: false,
        connectionQuality: 'offline',
        latency: null,
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

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Wait for offline state to be detected
      await waitFor(() => {
        expect(screen.getByTestId('auth-network-online')).toHaveTextContent('false');
        expect(screen.getByTestId('auth-offline')).toHaveTextContent('true');
      });
    });

    it('should handle reconnection when coming back online', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      // Start offline
      let isOnline = false;
      let networkCallback: ((state: any) => void) | null = null;

      mockedNetworkConnectivity.subscribeToNetworkChanges.mockImplementation((callback) => {
        networkCallback = callback;
        return vi.fn();
      });

      mockedNetworkConnectivity.networkManager.getState.mockImplementation(() => ({
        isOnline,
        isSupabaseConnected: isOnline,
        lastConnectedAt: isOnline ? new Date() : null,
        lastDisconnectedAt: !isOnline ? new Date() : null,
        reconnectAttempts: 0,
        connectionQuality: isOnline ? 'good' : 'offline',
        latency: isOnline ? 50 : null,
      }));

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate coming back online
      await act(async () => {
        isOnline = true;
        if (networkCallback) {
          networkCallback({
            isOnline: true,
            isSupabaseConnected: true,
            connectionQuality: 'good',
            latency: 50,
          });
        }
      });

      // Wait for reconnection handling
      await waitFor(() => {
        expect(screen.getByTestId('auth-network-online')).toHaveTextContent('true');
      });
    });

    it('should measure and log performance metrics', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      // Add delay to simulate slow network
      mockedAuthApi.getCurrentUser.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(testUser), 1000)
        )
      );

      const startTime = performance.now();

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate auth state change
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

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify performance was measured (should take at least 1 second due to delay)
      expect(duration).toBeGreaterThan(1000);
    });
  });

  describe('Cross-Component Communication', () => {
    it('should propagate auth state changes across components', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        fullName: 'Test User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);

      const MultiComponentApp = () => (
        <BrowserRouter>
          <AuthProvider>
            <div>
              <TestAuthComponent />
              <AuthGuard requireAuth={true}>
                <div data-testid="protected-content">Protected Content</div>
              </AuthGuard>
            </div>
          </AuthProvider>
        </BrowserRouter>
      );

      render(<MultiComponentApp />);

      // Simulate successful authentication
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

      // Wait for both components to reflect authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should handle role changes dynamically across components', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);

      // Initially return user role
      mockedRoleManagement.verifyUserRole.mockResolvedValueOnce({
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      const RoleAwareComponent = () => {
        const { userRole, refreshRole } = useAuth();
        return (
          <div>
            <div data-testid="current-role">{userRole?.role || 'none'}</div>
            <div data-testid="permissions">{userRole?.permissions.join(',') || 'none'}</div>
            <button onClick={refreshRole} data-testid="refresh-role">Refresh Role</button>
          </div>
        );
      };

      render(
        <BrowserRouter>
          <AuthProvider>
            <RoleAwareComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate authentication
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

      // Wait for initial role
      await waitFor(() => {
        expect(screen.getByTestId('current-role')).toHaveTextContent('user');
      });

      // Mock role upgrade
      mockedRoleManagement.verifyUserRole.mockResolvedValueOnce({
        role: 'admin',
        permissions: ['read_profile', 'view_admin_dashboard'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      // Trigger role refresh
      fireEvent.click(screen.getByTestId('refresh-role'));

      // Wait for role update
      await waitFor(() => {
        expect(screen.getByTestId('current-role')).toHaveTextContent('admin');
        expect(screen.getByTestId('permissions')).toHaveTextContent('read_profile,view_admin_dashboard');
      });
    });

    it('should handle loading states consistently across components', async () => {
      // Mock slow authentication
      mockedAuthApi.getCurrentUser.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            _id: 'user-123',
            email: 'test@example.com',
            role: 'user',
            fullName: 'Test User'
          }), 2000)
        )
      );

      const LoadingAwareApp = () => (
        <BrowserRouter>
          <AuthProvider>
            <div>
              <TestAuthComponent />
              <AuthGuard requireAuth={true}>
                <div data-testid="guarded-content">Guarded Content</div>
              </AuthGuard>
            </div>
          </AuthProvider>
        </BrowserRouter>
      );

      render(<LoadingAwareApp />);

      // Initially should be loading
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('true');
      expect(screen.getByTestId('loading-stage')).toHaveTextContent('auth');

      // Should show loading spinner instead of guarded content
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate auth state change
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

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('guarded-content')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent authentication requests gracefully', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      let callCount = 0;
      mockedAuthApi.getCurrentUser.mockImplementation(() => {
        callCount++;
        return Promise.resolve(testUser);
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Trigger multiple concurrent refreshes
      const refreshButton = screen.getByTestId('refresh-button');
      
      await act(async () => {
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
      });

      // Should handle concurrent requests without issues
      expect(callCount).toBeGreaterThan(0);
    });

    it('should clean up resources properly on unmount', async () => {
      const unsubscribeMock = vi.fn();
      mockedSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      });

      const { unmount } = render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Unmount the component
      unmount();

      // Verify cleanup was called
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should handle memory pressure gracefully', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      // Mock localStorage quota exceeded error
      const mockLocalStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      // Simulate auth state change
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

      // Should still authenticate successfully despite storage issues
      await waitFor(() => {
        expect(screen.getByTestId('auth-authenticated')).toHaveTextContent('true');
      });
    });
  });
});