import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import * as authApi from '@/utils/authApi'
import { supabase } from '@/integrations/supabase/client'

// Mock dependencies
vi.mock('@/utils/authApi')
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}))

const mockedAuthApi = vi.mocked(authApi)
const mockedSupabase = vi.mocked(supabase)

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="timeout">{auth.hasTimedOut.toString()}</div>
      <div data-testid="error">{auth.error?.message || 'none'}</div>
      <div data-testid="retry-count">{auth.retryCount}</div>
      <div data-testid="user-id">{auth.user?._id || 'none'}</div>
      <div data-testid="user-role">{auth.user?.role || 'none'}</div>
      <div data-testid="is-admin">{auth.isAdmin.toString()}</div>
      <div data-testid="is-super-user">{auth.isSuperUser.toString()}</div>
      <div data-testid="loading-stage">{auth.loadingState.stage}</div>
      <div data-testid="loading-progress">{auth.loadingState.progress}</div>
    </div>
  )
}

describe.skip('AuthContext Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('timeout')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
    expect(screen.getByTestId('retry-count')).toHaveTextContent('0')

    // Simulate no session auth state change
    const authStateCallback = (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mock.calls[0][0]
    await act(async () => {
      authStateCallback('SIGNED_OUT', null)
    })

    // Wait for session restoration to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should handle successful authentication', async () => {
    const user = {
      _id: 'test-id',
      email: 'test@example.com',
      role: 'admin',
      fullName: 'Test User'
    }

    mockedAuthApi.getCurrentUser.mockResolvedValue(user)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate auth state change
    const authStateCallback = (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mock.calls[0][0]
    await act(async () => {
      authStateCallback('SIGNED_IN', { user: { id: user._id, email: user.email } })
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    }, { timeout: 10000 })

    expect(screen.getByTestId('user-id')).toHaveTextContent(user._id)
    expect(screen.getByTestId('user-role')).toHaveTextContent(user.role)
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
    expect(screen.getByTestId('is-super-user')).toHaveTextContent('false')
  })

  it('should handle authentication errors', async () => {
    const error = new Error('Authentication failed')
    mockedAuthApi.getCurrentUser.mockRejectedValue(error)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate failed auth state change
    const authStateCallback = (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mock.calls[0][0]
    await act(async () => {
      authStateCallback('SIGNED_IN', { user: { id: 'test-id', email: 'test@example.com' } })
    })

    await waitFor(() => {
      const errorText = screen.getByTestId('error').textContent
      expect(errorText).toContain('Authentication failed')
    }, { timeout: 10000 })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user-id')).toHaveTextContent('none')
  })

  it('should handle role-based permissions correctly', async () => {
    const testCases = [
      { role: 'user', expectedAdmin: false, expectedSuper: false },
      { role: 'admin', expectedAdmin: true, expectedSuper: false },
      { role: 'superadmin', expectedAdmin: true, expectedSuper: true },
    ]

    for (const testCase of testCases) {
      const user = {
        _id: 'test-id',
        email: 'test@example.com',
        role: testCase.role,
        fullName: 'Test User'
      }

      mockedAuthApi.getCurrentUser.mockResolvedValue(user)

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate auth state change
      const authStateCallback = (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mock.calls[0][0]
      await act(async () => {
        authStateCallback('SIGNED_IN', { user: { id: user._id, email: user.email } })
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      expect(screen.getByTestId('is-admin')).toHaveTextContent(testCase.expectedAdmin.toString())
      expect(screen.getByTestId('is-super-user')).toHaveTextContent(testCase.expectedSuper.toString())

      unmount()
      vi.clearAllMocks()
    }
  })

  it('should log authentication events', async () => {
    const consoleSpy = vi.spyOn(console, 'log')

    const user = {
      _id: 'test-id',
      email: 'test@example.com',
      role: 'user',
      fullName: 'Test User'
    }

    mockedAuthApi.getCurrentUser.mockResolvedValue(user)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Simulate auth state change
    const authStateCallback = (mockedSupabase.auth.onAuthStateChange as unknown as import('vitest').MockInstance).mock.calls[0][0]
    await act(async () => {
      authStateCallback('SIGNED_IN', { user: { id: user._id, email: user.email } })
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    // Verify logging occurred
    const logCalls = consoleSpy.mock.calls.filter(call =>
      call[0] && call[0].includes('[AUTH]')
    )

    expect(logCalls.length).toBeGreaterThan(0)

    // Check for specific log events
    const logMessages = logCalls.map(call => call[0])
    expect(logMessages.some(msg => msg.includes('AUTH_PROVIDER_MOUNT'))).toBe(true)
    expect(logMessages.some(msg => msg.includes('SUPABASE_AUTH_STATE_CHANGE'))).toBe(true)

    consoleSpy.mockRestore()
  })
})