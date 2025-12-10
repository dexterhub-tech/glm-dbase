/**
 * Network Connectivity Tests
 * 
 * Tests for network connectivity detection and management functionality.
 * 
 * Requirements: 2.1, 2.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  networkManager, 
  checkConnectivity, 
  cacheAuthState, 
  getCachedAuthState, 
  clearCachedAuthState,
  generateConnectionError 
} from './networkConnectivity';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ error: null }))
    }
  }
}));

describe('Network Connectivity Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    clearCachedAuthState();
  });

  describe('Basic Connectivity Detection', () => {
    it('should detect when browser is online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const state = await checkConnectivity();
      expect(state.isOnline).toBe(true);
    });

    it('should detect when browser is offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const state = await checkConnectivity();
      expect(state.isOnline).toBe(false);
      expect(state.isSupabaseConnected).toBe(false);
      expect(state.connectionQuality).toBe('offline');
    });
  });

  describe('State Caching', () => {
    it('should cache authentication state', () => {
      const mockUser = { _id: 'test-user', email: 'test@example.com', role: 'user' };
      const mockRole = { role: 'user' as const, permissions: ['read_profile'], isVerified: true, lastVerified: new Date() };

      cacheAuthState(mockUser, mockRole);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'network.cachedState',
        expect.stringContaining('"user":')
      );
    });

    it('should retrieve cached authentication state', () => {
      const mockUser = { _id: 'test-user', email: 'test@example.com', role: 'user' };
      const mockRole = { role: 'user' as const, permissions: ['read_profile'], isVerified: true, lastVerified: new Date() };

      // First cache the state
      cacheAuthState(mockUser, mockRole);

      // Then retrieve it
      const cached = getCachedAuthState();
      expect(cached).toBeTruthy();
      expect(cached?.user._id).toBe('test-user');
    });

    it('should return null for expired cached state', () => {
      const expiredCachedData = {
        user: { _id: 'test-user', email: 'test@example.com', role: 'user' },
        userRole: { role: 'user', permissions: ['read_profile'], isVerified: true, lastVerified: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredCachedData));

      const cached = getCachedAuthState();
      expect(cached).toBeNull();
    });

    it('should clear cached authentication state', () => {
      clearCachedAuthState();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('network.cachedState');
    });
  });

  describe('Connection Error Generation', () => {
    it('should generate network error for offline state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const error = generateConnectionError(new Error('Network error'));
      
      expect(error.type).toBe('network');
      expect(error.message).toBe('No internet connection detected');
      expect(error.troubleshootingSteps).toContain('Check your internet connection');
      expect(error.canRetry).toBe(true);
    });

    it('should generate timeout error for timeout scenarios', () => {
      const timeoutError = new Error('Connection timeout');
      const error = generateConnectionError(timeoutError);
      
      expect(error.type).toBe('timeout');
      expect(error.message).toBe('Connection timed out');
      expect(error.troubleshootingSteps).toContain('Check your internet connection speed');
      expect(error.canRetry).toBe(true);
    });

    it('should generate supabase error for database issues', () => {
      const supabaseError = { message: 'PGRST error', code: 'PGRST001' };
      const error = generateConnectionError(supabaseError);
      
      expect(error.type).toBe('supabase');
      expect(error.message).toBe('Database connection failed');
      expect(error.troubleshootingSteps).toContain('The service may be temporarily unavailable');
      expect(error.canRetry).toBe(true);
    });

    it('should generate unknown error for unrecognized issues', () => {
      const unknownError = new Error('Some random error');
      const error = generateConnectionError(unknownError);
      
      expect(error.type).toBe('unknown');
      expect(error.message).toBe('Some random error');
      expect(error.troubleshootingSteps).toContain('Try refreshing the page');
      expect(error.canRetry).toBe(true);
    });
  });

  describe('Network State Management', () => {
    it('should provide current network state', () => {
      const state = networkManager.getState();
      
      expect(state).toHaveProperty('isOnline');
      expect(state).toHaveProperty('isSupabaseConnected');
      expect(state).toHaveProperty('connectionQuality');
      expect(state).toHaveProperty('latency');
      expect(state).toHaveProperty('reconnectAttempts');
    });

    it('should allow subscribing to network state changes', () => {
      const mockListener = vi.fn();
      
      const unsubscribe = networkManager.subscribe(mockListener);
      
      // Should call listener immediately with current state
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: expect.any(Boolean),
          isSupabaseConnected: expect.any(Boolean),
        })
      );

      // Clean up
      unsubscribe();
    });
  });
});

describe('Network Connectivity Integration', () => {
  it('should handle offline scenarios gracefully', async () => {
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const state = await checkConnectivity();
    
    expect(state.isOnline).toBe(false);
    expect(state.isSupabaseConnected).toBe(false);
    expect(state.connectionQuality).toBe('offline');
  });

  it('should provide troubleshooting steps for connection issues', () => {
    const networkError = new Error('fetch failed');
    const connectionError = generateConnectionError(networkError);
    
    expect(connectionError.troubleshootingSteps).toBeInstanceOf(Array);
    expect(connectionError.troubleshootingSteps.length).toBeGreaterThan(0);
    expect(connectionError.troubleshootingSteps[0]).toContain('Check');
  });
});