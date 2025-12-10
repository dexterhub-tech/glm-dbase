/**
 * Authentication Flows Integration Tests
 * 
 * Tests complete login to dashboard flow, error recovery scenarios,
 * and role-based access control integration.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import EnhancedRouteProtection from '@/components/auth/EnhancedRouteProtection';
import { supabase } from '@/integrations/supabase/client';
import * as authApi from '@/utils/authApi';
import * as networkConnectivity from '@/utils/networkConnectivity';
import * as errorRecovery from '@/utils/errorRecovery';
import * as roleManagement from '@/utils/roleManagement';

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

// Test components
const LoginPage = () => (
  <div data-testid="login-page">
    <h1>Login</h1>
    <button data-testid="login-button">Login</button>
  </div>
);

const AdminDashboard = () => (
  <div data-testid="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <div data-testid="admin-content">Admin Content</div>
  </div>
);

const UserDashboard = () => (
  <div data-testid="user-dashboard">
    <h1>User Dashboard</h1>
    <div data-testid="user-content">User Content</div>
  </div>
);

const TestApp = ({
  initialRoute = '/login',
  userRole = 'user',
  requireAuth = true,
  requiredPermission,
}: {
  initialRoute?: string;
  userRole?: string;
  requireAuth?: boolean;
  requiredPermission?: string;
}) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      <EnhancedRouteProtection>
        {initialRoute === '/login' ? (
          <LoginPage />
        ) : (
          <AuthGuard
            requireAuth={requireAuth}
            requiredPermission={requiredPermission}
          >
            {userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />}
          </AuthGuard>
        )}
      </EnhancedRouteProtection>
    </AuthProvider>
  </MemoryRouter>
);

describe('Authentication Flows Integration Tests', () => {
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
        connectionQuality: 'good' as const,
        latency: 50,
      })),
      subscribe: vi.fn(() => vi.fn()),
    } as any;

    mockedNetworkConnectivity.subscribeToNetworkChanges.mockImplementation(() => vi.fn());
    mockedNetworkConnectivity.getCachedAuthState.mockReturnValue(null);
    mockedNetworkConnectivity.cacheAuthState.mockImplementation(() => { });
    mockedNetworkConnectivity.clearCachedAuthState.mockImplementation(() => { });
    mockedNetworkConnectivity.generateConnectionError.mockImplementation((error) => ({
      type: 'network',
      message: error.message || 'Connection failed',
      canRetry: true,
      retryDelay: 1000,
      troubleshootingSteps: ['Check your internet connection'],
    }));

    mockedErrorRecovery.executeWithRecovery.mockImplementation(async (operation) => {
      try {
        const result = await operation();
        return { success: true, result, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      } catch (error) {
        return { success: false, error, attemptsUsed: 1, fallbackUsed: false, offlineMode: false };
      }
    });

    mockedErrorRecovery.initiateUserRecovery.mockResolvedValue({
      success: true,
      attemptsUsed: 1,
      fallbackUsed: false,
      offlineMode: false,
    });

    mockedErrorRecovery.registerFallbackAuthMethod.mockImplementation(() => { });
    mockedErrorRecovery.registerDegradationHandler.mockImplementation(() => { });

    (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Login to Dashboard Flow', () => {
    it('should complete successful login flow for admin user', async () => {
      const adminUser = {
        _id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(adminUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'admin',
        permissions: ['view_admin_dashboard', 'manage_users'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      const startTime = performance.now();

      render(<TestApp
        initialRoute="/admin"
        userRole="admin"
        requiredPermission="view_admin_dashboard"
      />);

      // Simulate successful authentication
      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: adminUser._id, email: adminUser.email },
          access_token: 'valid-admin-token'
        });
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify login completed within reasonable time (< 3 seconds as per requirement 1.1)
      expect(duration).toBeLessThan(3000);
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(mockedRoleManagement.verifyUserRole).toHaveBeenCalledWith(adminUser._id);
    });

    it('should complete successful login flow for regular user', async () => {
      const regularUser = {
        _id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        fullName: 'Regular User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(regularUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'user',
        permissions: ['read_profile', 'update_own_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      // Simulate successful authentication
      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: regularUser._id, email: regularUser.email },
          access_token: 'valid-user-token'
        });
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByTestId('user-content')).toBeInTheDocument();
    });

    it('should redirect unauthenticated users to login', async () => {
      // No user authenticated
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Not authenticated'));

      render(<TestApp
        initialRoute="/admin"
        userRole="admin"
        requiredPermission="view_admin_dashboard"
      />);

      // Should show loading initially, then redirect or show access denied
      await waitFor(() => {
        // Should not show admin dashboard
        expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
        // Should show either loading or access denied
        expect(
          screen.getByText('Loading...') || screen.getByText('Access Denied')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary network failures', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      // First call fails, second succeeds
      mockedAuthApi.getCurrentUser
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue(testUser);

      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      // Simulate failed then successful auth
      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      // First attempt fails
      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      // Wait a moment for retry mechanism
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second attempt should succeed
      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should use cached state during network outages', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      const cachedState = {
        user: testUser,
        userRole: {
          role: 'user' as const,
          permissions: ['read_profile'],
          isVerified: true,
          lastVerified: new Date(),
        },
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      // Mock network failure
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Network unavailable'));
      mockedNetworkConnectivity.getCachedAuthState.mockReturnValue(cachedState);
      mockedNetworkConnectivity.generateConnectionError.mockReturnValue({
        type: 'network',
        message: 'No internet connection detected',
        canRetry: true,
        retryDelay: 1000,
        troubleshootingSteps: ['Check your internet connection'],
      });

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      // Simulate network failure during auth
      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      // Should eventually show dashboard using cached state
      await waitFor(() => {
        expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle authentication service unavailability', async () => {
      // Mock service unavailable error
      mockedAuthApi.getCurrentUser.mockRejectedValue(new Error('Service unavailable'));
      mockedErrorRecovery.executeWithRecovery.mockResolvedValue({
        success: false,
        error: new Error('Service unavailable'),
        attemptsUsed: 3,
        fallbackUsed: true,
        offlineMode: true,
      });

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      // Should handle service unavailability gracefully
      await waitFor(() => {
        // Should not crash and should show appropriate state
        expect(screen.queryByTestId('user-dashboard')).not.toBeInTheDocument();
        expect(
          screen.getByText('Loading...') ||
          screen.getByText('Access Denied') ||
          screen.queryByText(/error/i)
        ).toBeTruthy();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should grant access to users with correct permissions', async () => {
      const adminUser = {
        _id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(adminUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'admin',
        permissions: ['view_admin_dashboard', 'manage_users'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      render(<TestApp
        initialRoute="/admin"
        userRole="admin"
        requiredPermission="view_admin_dashboard"
      />);

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: adminUser._id, email: adminUser.email }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      });
    });

    it('should deny access to users without required permissions', async () => {
      const regularUser = {
        _id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        fullName: 'Regular User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(regularUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      render(<TestApp
        initialRoute="/admin"
        userRole="user"
        requiredPermission="view_admin_dashboard"
      />);

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: regularUser._id, email: regularUser.email }
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });

    it('should handle role verification failures gracefully', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);
      // Mock role verification failure
      mockedRoleManagement.verifyUserRole.mockRejectedValue(new Error('Role verification failed'));

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      // Should still allow access with fallback permissions
      await waitFor(() => {
        // Should either show dashboard (with fallback) or handle gracefully
        expect(
          screen.getByTestId('user-dashboard') ||
          screen.getByText('Access Denied') ||
          screen.getByText('Loading...')
        ).toBeTruthy();
      });
    });

    it('should re-verify permissions for admin features', async () => {
      const adminUser = {
        _id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        fullName: 'Admin User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(adminUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'admin',
        permissions: ['view_admin_dashboard', 'manage_users'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      mockedRoleManagement.reVerifyAdminPermissions.mockResolvedValue({
        hasPermission: true,
        fallbackApplied: false,
      });

      const AdminFeatureComponent = () => (
        <AuthGuard
          requireAuth={true}
          requiredPermission="manage_users"
          reVerifyForAdmin={true}
        >
          <div data-testid="admin-feature">Admin Feature</div>
        </AuthGuard>
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminFeatureComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: adminUser._id, email: adminUser.email }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('admin-feature')).toBeInTheDocument();
      });

      // Verify that re-verification was called
      expect(mockedRoleManagement.reVerifyAdminPermissions).toHaveBeenCalledWith('manage_users');
    });
  });

  describe('Performance and Timing', () => {
    it('should complete authentication within performance thresholds', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      mockedAuthApi.getCurrentUser.mockResolvedValue(testUser);
      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      const startTime = performance.now();

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds (requirement 1.1)
      expect(duration).toBeLessThan(3000);
    });

    it('should show loading indicators during authentication', async () => {
      const testUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      // Add delay to simulate network latency
      mockedAuthApi.getCurrentUser.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve(testUser), 1000)
        )
      );

      mockedRoleManagement.verifyUserRole.mockResolvedValue({
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
        fallbackApplied: false,
      });

      render(<TestApp
        initialRoute="/dashboard"
        userRole="user"
        requiredPermission="read_profile"
      />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      const mockAuthStateChange = vi.fn();
      (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mockImplementation((callback: any) => {
        mockAuthStateChange.mockImplementation(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      await act(async () => {
        mockAuthStateChange('SIGNED_IN', {
          user: { id: testUser._id, email: testUser.email }
        });
      });

      // Eventually should show dashboard
      await waitFor(() => {
        expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});