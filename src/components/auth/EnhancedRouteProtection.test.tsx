import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, type MockedFunction } from 'vitest';
import EnhancedRouteProtection from './EnhancedRouteProtection';
import { useAuth } from '@/contexts/AuthContext';
import * as routeConfig from '@/config/routeConfig';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the route config
vi.mock('@/config/routeConfig', () => ({
  getRouteConfig: vi.fn()
}));

// Mock the logging utility
vi.mock('@/utils/comprehensiveLogging', () => ({
  logAuthEvent: vi.fn()
}));

const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;
const mockGetRouteConfig = routeConfig.getRouteConfig as MockedFunction<typeof routeConfig.getRouteConfig>;

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('EnhancedRouteProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state during route verification', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasPermission: vi.fn(() => false),
      reVerifyPermissions: vi.fn(),
      userRole: null,
      hasTimedOut: false,
      error: null,
      isAdmin: false,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: true,
        progress: 0,
        stage: 'auth',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: false,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'offline',
        latency: null,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    mockGetRouteConfig.mockReturnValue({
      path: '/admin',
      requireAuth: true,
      requiredPermission: 'view_admin_dashboard'
    });

    renderWithRouter(
      <EnhancedRouteProtection>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/admin']
    );

    expect(screen.getByText('Verifying route access...')).toBeInTheDocument();
  });

  it('should allow access to public routes', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasPermission: vi.fn(() => false),
      reVerifyPermissions: vi.fn(),
      userRole: null,
      hasTimedOut: false,
      error: null,
      isAdmin: false,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: false,
        progress: 0,
        stage: 'complete',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: false,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'offline',
        latency: null,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    // Mock public route (no config)
    mockGetRouteConfig.mockReturnValue(null);

    renderWithRouter(
      <EnhancedRouteProtection>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/public']
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should grant access when user has required permissions', async () => {
    mockUseAuth.mockReturnValue({
      user: { _id: 'user1', email: 'admin@example.com', role: 'admin' },
      isLoading: false,
      isAuthenticated: true,
      hasPermission: vi.fn(() => true),
      reVerifyPermissions: vi.fn().mockResolvedValue(true),
      userRole: {
        role: 'admin',
        permissions: ['view_admin_dashboard'],
        isVerified: true,
        lastVerified: new Date(),
      },
      hasTimedOut: false,
      error: null,
      isAdmin: true,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: false,
        progress: 100,
        stage: 'complete',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: true,
        lastConnectedAt: new Date(),
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'good',
        latency: 50,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    mockGetRouteConfig.mockReturnValue({
      path: '/admin',
      requireAuth: true,
      requiredPermission: 'view_admin_dashboard'
    });

    renderWithRouter(
      <EnhancedRouteProtection>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/admin']
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should show access denied when user lacks required permission', async () => {
    mockUseAuth.mockReturnValue({
      user: { _id: 'user1', email: 'user@example.com', role: 'user' },
      isLoading: false,
      isAuthenticated: true,
      hasPermission: vi.fn(() => false),
      reVerifyPermissions: vi.fn().mockResolvedValue(false),
      userRole: {
        role: 'user',
        permissions: ['read_profile'],
        isVerified: true,
        lastVerified: new Date(),
      },
      hasTimedOut: false,
      error: null,
      isAdmin: false,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: false,
        progress: 100,
        stage: 'complete',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: true,
        lastConnectedAt: new Date(),
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'good',
        latency: 50,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    mockGetRouteConfig.mockReturnValue({
      path: '/admin',
      requireAuth: true,
      requiredPermission: 'view_admin_dashboard'
    });

    renderWithRouter(
      <EnhancedRouteProtection>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/admin']
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  it('should call onAuthRequired callback when authentication is required', async () => {
    const onAuthRequired = vi.fn();

    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasPermission: vi.fn(() => false),
      reVerifyPermissions: vi.fn(),
      userRole: null,
      hasTimedOut: false,
      error: null,
      isAdmin: false,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: false,
        progress: 0,
        stage: 'complete',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: false,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'offline',
        latency: null,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    mockGetRouteConfig.mockReturnValue({
      path: '/admin',
      requireAuth: true,
      redirectTo: '/auth/login'
    });

    renderWithRouter(
      <EnhancedRouteProtection onAuthRequired={onAuthRequired}>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/admin']
    );

    await waitFor(() => {
      expect(onAuthRequired).toHaveBeenCalledWith('/admin', 'Authentication required');
    });
  });

  it('should use re-verification for admin routes when configured', async () => {
    const mockReVerifyPermissions = vi.fn().mockResolvedValue(true);

    mockUseAuth.mockReturnValue({
      user: { _id: 'user1', email: 'admin@example.com', role: 'admin' },
      isLoading: false,
      isAuthenticated: true,
      hasPermission: vi.fn(() => true),
      reVerifyPermissions: mockReVerifyPermissions,
      userRole: {
        role: 'admin',
        permissions: ['manage_users'],
        isVerified: true,
        lastVerified: new Date(),
      },
      hasTimedOut: false,
      error: null,
      isAdmin: true,
      isSuperUser: false,
      retryCount: 0,
      loadingState: {
        isLoading: false,
        progress: 100,
        stage: 'complete',
        timeoutAt: null,
      },
      refresh: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
      retry: vi.fn(),
      refreshRole: vi.fn(),
      validateAndCleanupSession: vi.fn(),
      getStorageInfo: vi.fn(),
      networkState: {
        isOnline: true,
        isSupabaseConnected: true,
        lastConnectedAt: new Date(),
        lastDisconnectedAt: null,
        reconnectAttempts: 0,
        connectionQuality: 'good',
        latency: 50,
      },
      connectionError: null,
      isOffline: false,
      startReconnection: vi.fn(),
      stopReconnection: vi.fn(),
      executeWithRecovery: vi.fn(),
      initiateRecovery: vi.fn(),
      registerFallbackMethod: vi.fn(),
    });

    mockGetRouteConfig.mockReturnValue({
      path: '/admin/users',
      requireAuth: true,
      requiredPermission: 'manage_users',
      reVerifyForAdmin: true
    });

    renderWithRouter(
      <EnhancedRouteProtection>
        <TestComponent />
      </EnhancedRouteProtection>,
      ['/admin/users']
    );

    await waitFor(() => {
      expect(mockReVerifyPermissions).toHaveBeenCalledWith('manage_users');
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});