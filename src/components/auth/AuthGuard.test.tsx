import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthGuard from './AuthGuard';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the logging utility
vi.mock('@/utils/comprehensiveLogging', () => ({
  logAuthEvent: vi.fn()
}));

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when authentication is loading', () => {
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
    });

    renderWithRouter(
      <AuthGuard>
        <TestComponent />
      </AuthGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render children when user is authenticated and has required permission', async () => {
    mockUseAuth.mockReturnValue({
      user: { _id: 'user1', email: 'test@example.com', role: 'admin' },
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
    });

    renderWithRouter(
      <AuthGuard requiredPermission="view_admin_dashboard">
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should show access denied when user lacks required permission', async () => {
    mockUseAuth.mockReturnValue({
      user: { _id: 'user1', email: 'test@example.com', role: 'user' },
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
    });

    renderWithRouter(
      <AuthGuard requiredPermission="admin_access">
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  it('should allow access when requireAuth is false', async () => {
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
    });

    renderWithRouter(
      <AuthGuard requireAuth={false}>
        <TestComponent />
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});