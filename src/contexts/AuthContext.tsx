import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getAccessToken, getCurrentUser, clearAccessToken } from '@/utils/authApi';
import type { CurrentUser } from '@/utils/authApi';
import { supabase } from "@/integrations/supabase/client";
import { 
  networkManager, 
  cacheAuthState, 
  getCachedAuthState, 
  clearCachedAuthState,
  startReconnection,
  stopReconnection,
  generateConnectionError,
  subscribeToNetworkChanges,
  type NetworkState,
  type ConnectionError
} from '@/utils/networkConnectivity';
import { 
  executeWithRecovery,
  initiateUserRecovery,
  registerFallbackAuthMethod,
  registerDegradationHandler,
  type RecoveryResult,
  type OperationContext
} from '@/utils/errorRecovery';

interface AuthError {
  message: string;
  code?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasTimedOut: boolean;
  error: AuthError | null;
  retryCount: number;
}

interface UserRole {
  role: 'admin' | 'superuser' | 'user';
  permissions: string[];
  isVerified: boolean;
  lastVerified: Date;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: 'auth' | 'profile' | 'dashboard' | 'complete';
  timeoutAt: Date | null;
}

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperUser: boolean;
  isAuthenticated: boolean;
  hasTimedOut: boolean;
  error: AuthError | null;
  retryCount: number;
  loadingState: LoadingState;
  userRole: UserRole | null;
  refresh: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  retry: () => Promise<void>;
  // Enhanced role management methods
  refreshRole: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  reVerifyPermissions: (permission?: string) => Promise<boolean>;
  // Enhanced session management methods
  validateAndCleanupSession: () => Promise<void>;
  getStorageInfo: () => any;
  // Network connectivity methods
  networkState: NetworkState;
  connectionError: ConnectionError | null;
  isOffline: boolean;
  startReconnection: () => void;
  stopReconnection: () => void;
  // Error recovery methods
  executeWithRecovery: <T>(operation: () => Promise<T>, operationId?: string) => Promise<RecoveryResult<T>>;
  initiateRecovery: (action: 'retry' | 'refresh' | 'reset' | 'clear_cache' | 'force_logout') => Promise<RecoveryResult>;
  registerFallbackMethod: (method: () => Promise<any>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isSuperUser: false,
  isAuthenticated: false,
  hasTimedOut: false,
  error: null,
  retryCount: 0,
  loadingState: {
    isLoading: true,
    progress: 0,
    stage: 'auth',
    timeoutAt: null,
  },
  userRole: null,
  refresh: async () => { },
  logout: () => { },
  clearError: () => { },
  retry: async () => { },
  refreshRole: async () => { },
  hasPermission: () => false,
  reVerifyPermissions: async () => false,
  validateAndCleanupSession: async () => { },
  getStorageInfo: () => ({}),
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
  startReconnection: () => { },
  stopReconnection: () => { },
  executeWithRecovery: async () => ({ success: false, attemptsUsed: 0, fallbackUsed: false, offlineMode: false }),
  initiateRecovery: async () => ({ success: false, attemptsUsed: 0, fallbackUsed: false, offlineMode: false }),
  registerFallbackMethod: () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Constants for configuration
const AUTH_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second

// Enhanced storage utility with comprehensive fallback mechanisms
const createStorageManager = () => {
  const testStorage = (storage: Storage) => {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      const retrieved = storage.getItem(testKey);
      storage.removeItem(testKey);
      return retrieved === 'test';
    } catch {
      return false;
    }
  };

  const isLocalStorageAvailable = testStorage(localStorage);
  const isSessionStorageAvailable = testStorage(sessionStorage);
  
  // Enhanced in-memory fallback storage with size limits and expiration
  const memoryStorage = new Map<string, { value: string; timestamp: number; expires?: number }>();
  const MAX_MEMORY_ITEMS = 50;
  const DEFAULT_MEMORY_TTL = 30 * 60 * 1000; // 30 minutes
  
  const cleanupMemoryStorage = () => {
    const now = Date.now();
    const entries = Array.from(memoryStorage.entries());
    
    // Remove expired items
    entries.forEach(([key, data]) => {
      if (data.expires && now > data.expires) {
        memoryStorage.delete(key);
      }
    });
    
    // If still over limit, remove oldest items
    if (memoryStorage.size > MAX_MEMORY_ITEMS) {
      const sortedEntries = entries
        .filter(([, data]) => !data.expires || now <= data.expires)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, memoryStorage.size - MAX_MEMORY_ITEMS);
      toRemove.forEach(([key]) => memoryStorage.delete(key));
    }
  };
  
  return {
    getItem: (key: string): string | null => {
      // Try localStorage first
      if (isLocalStorageAvailable) {
        try {
          const value = localStorage.getItem(key);
          if (value !== null) return value;
        } catch (error) {
          logAuthEvent('LOCALSTORAGE_GET_ERROR', { key }, error);
        }
      }
      
      // Try sessionStorage second
      if (isSessionStorageAvailable) {
        try {
          const value = sessionStorage.getItem(key);
          if (value !== null) return value;
        } catch (error) {
          logAuthEvent('SESSIONSTORAGE_GET_ERROR', { key }, error);
        }
      }
      
      // Try memory storage last
      const memoryData = memoryStorage.get(key);
      if (memoryData) {
        const now = Date.now();
        if (!memoryData.expires || now <= memoryData.expires) {
          return memoryData.value;
        } else {
          // Expired, remove it
          memoryStorage.delete(key);
          logAuthEvent('MEMORY_STORAGE_EXPIRED', { key });
        }
      }
      
      return null;
    },
    
    setItem: (key: string, value: string, options?: { ttl?: number; preferMemory?: boolean }): void => {
      const ttl = options?.ttl || DEFAULT_MEMORY_TTL;
      const preferMemory = options?.preferMemory || false;
      
      // If preferMemory is true, try memory first
      if (preferMemory) {
        cleanupMemoryStorage();
        memoryStorage.set(key, {
          value,
          timestamp: Date.now(),
          expires: Date.now() + ttl
        });
        logAuthEvent('MEMORY_STORAGE_SET', { key, ttl });
        return;
      }
      
      // Try localStorage first
      if (isLocalStorageAvailable) {
        try {
          localStorage.setItem(key, value);
          return;
        } catch (error) {
          logAuthEvent('LOCALSTORAGE_SET_ERROR', { key, errorType: 'quota_exceeded' }, error);
          
          // If quota exceeded, try to clear some space
          if (error.name === 'QuotaExceededError') {
            try {
              // Clear old auth data to make space
              const keysToCheck = ['auth.session.backup', 'auth.metadata'];
              keysToCheck.forEach(k => {
                try {
                  localStorage.removeItem(k);
                } catch {}
              });
              
              // Try again
              localStorage.setItem(key, value);
              logAuthEvent('LOCALSTORAGE_SET_RETRY_SUCCESS', { key });
              return;
            } catch (retryError) {
              logAuthEvent('LOCALSTORAGE_SET_RETRY_FAILED', { key }, retryError);
            }
          }
        }
      }
      
      // Try sessionStorage second
      if (isSessionStorageAvailable) {
        try {
          sessionStorage.setItem(key, value);
          return;
        } catch (error) {
          logAuthEvent('SESSIONSTORAGE_SET_ERROR', { key }, error);
        }
      }
      
      // Fallback to memory storage
      cleanupMemoryStorage();
      memoryStorage.set(key, {
        value,
        timestamp: Date.now(),
        expires: Date.now() + ttl
      });
      logAuthEvent('FALLBACK_MEMORY_STORAGE_SET', { key, ttl });
    },
    
    removeItem: (key: string): void => {
      // Remove from all storage types
      if (isLocalStorageAvailable) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logAuthEvent('LOCALSTORAGE_REMOVE_ERROR', { key }, error);
        }
      }
      
      if (isSessionStorageAvailable) {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          logAuthEvent('SESSIONSTORAGE_REMOVE_ERROR', { key }, error);
        }
      }
      
      memoryStorage.delete(key);
    },
    
    clear: (): void => {
      if (isLocalStorageAvailable) {
        try {
          // Only clear auth-related keys to avoid affecting other apps
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('auth.') || key.startsWith('supabase.')
          );
          authKeys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
          logAuthEvent('LOCALSTORAGE_CLEAR_ERROR', {}, error);
        }
      }
      
      if (isSessionStorageAvailable) {
        try {
          const authKeys = Object.keys(sessionStorage).filter(key => 
            key.startsWith('auth.') || key.startsWith('supabase.')
          );
          authKeys.forEach(key => sessionStorage.removeItem(key));
        } catch (error) {
          logAuthEvent('SESSIONSTORAGE_CLEAR_ERROR', {}, error);
        }
      }
      
      memoryStorage.clear();
    },
    
    // Enhanced availability info
    isAvailable: {
      localStorage: isLocalStorageAvailable,
      sessionStorage: isSessionStorageAvailable,
      memoryOnly: !isLocalStorageAvailable && !isSessionStorageAvailable,
    },
    
    // New utility methods
    getStorageInfo: () => ({
      localStorage: {
        available: isLocalStorageAvailable,
        usage: isLocalStorageAvailable ? Object.keys(localStorage).length : 0,
      },
      sessionStorage: {
        available: isSessionStorageAvailable,
        usage: isSessionStorageAvailable ? Object.keys(sessionStorage).length : 0,
      },
      memoryStorage: {
        usage: memoryStorage.size,
        maxItems: MAX_MEMORY_ITEMS,
      }
    }),
    
    // Cleanup method for memory storage
    cleanup: cleanupMemoryStorage,
  };
};

// Enhanced session validation utility with comprehensive checks
const validateSession = (sessionData: any): boolean => {
  if (!sessionData) return false;
  
  try {
    const parsed = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    
    // Check for required session properties
    if (!parsed.access_token && !parsed.refresh_token) {
      logAuthEvent('SESSION_VALIDATION_MISSING_TOKENS', { parsed });
      return false;
    }
    
    // Check expiration if present
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        logAuthEvent('SESSION_EXPIRED', { expiresAt, now });
        return false;
      }
    }
    
    // Check session timestamp to detect stale sessions (older than 7 days)
    if (parsed.timestamp) {
      const sessionTime = new Date(parsed.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 7) {
        logAuthEvent('SESSION_STALE', { sessionTime, daysDiff });
        return false;
      }
    }
    
    // Validate session structure integrity
    if (parsed.user && typeof parsed.user !== 'object') {
      logAuthEvent('SESSION_INVALID_USER_DATA', { userType: typeof parsed.user });
      return false;
    }
    
    return true;
  } catch (error) {
    logAuthEvent('SESSION_VALIDATION_ERROR', { sessionData }, error);
    return false;
  }
};

// Import comprehensive logging and performance monitoring
import { 
  logAuthEvent as logAuth, 
  logPerformanceMetric, 
  logSystemEvent,
  captureDebugContext,
  startMeasurement,
  endMeasurement
} from '@/utils/comprehensiveLogging';

// Enhanced logging utility with performance integration
const logAuthEvent = (event: string, data?: any, error?: any, userId?: string) => {
  logAuth(event, data, error, userId);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    hasTimedOut: false,
    error: null,
    retryCount: 0,
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    stage: 'auth',
    timeoutAt: new Date(Date.now() + AUTH_TIMEOUT_MS),
  });

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);
  
  // Network connectivity state
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    isSupabaseConnected: false,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    connectionQuality: 'offline',
    latency: null,
  });
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageManager = useRef(createStorageManager());
  const networkUnsubscribeRef = useRef<(() => void) | null>(null);

  const createAuthError = (message: string, code?: string, context?: Record<string, any>): AuthError => ({
    message,
    code,
    timestamp: new Date(),
    context,
  });

  const updateLoadingProgress = (stage: LoadingState['stage'], progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      progress,
      isLoading: progress < 100,
    }));
  };

  const computeRoles = useCallback(async (user: CurrentUser) => {
    const performanceId = startMeasurement('role_computation', 'auth', { userId: user._id });
    logAuthEvent('ROLE_COMPUTATION_START', { userId: user._id, userRole: user.role }, undefined, user._id);
    
    try {
      // Import role verification function
      const { verifyUserRole } = await import('@/utils/roleManagement');
      
      // Get enhanced role verification
      const roleVerification = await verifyUserRole(user._id);
      
      // Update role state based on verification
      setUserRole(roleVerification);
      
      // Compute legacy boolean flags for backward compatibility
      const isAdminRole = roleVerification.role === 'admin' || 
        roleVerification.permissions.includes('view_admin_dashboard');
      const isSuperRole = roleVerification.permissions.includes('system_admin');
      
      setIsAdmin(isAdminRole);
      setIsSuperUser(isSuperRole);

      endMeasurement(performanceId, { 
        success: true, 
        role: roleVerification.role,
        permissionCount: roleVerification.permissions.length,
        fallbackApplied: roleVerification.fallbackApplied
      });

      logAuthEvent('ROLE_COMPUTED_ENHANCED', { 
        userId: user._id,
        role: roleVerification.role,
        permissions: roleVerification.permissions,
        isAdmin: isAdminRole, 
        isSuperUser: isSuperRole,
        fallbackApplied: roleVerification.fallbackApplied,
        isVerified: roleVerification.isVerified
      }, undefined, user._id);

      // Dispatch role change event for other components
      const roleChangeEvent = new CustomEvent('roleChanged', {
        detail: {
          userId: user._id,
          roleData: roleVerification,
          isAdmin: isAdminRole,
          isSuperUser: isSuperRole
        }
      });
      window.dispatchEvent(roleChangeEvent);

    } catch (error: any) {
      endMeasurement(performanceId, { success: false, error: error.message, fallbackUsed: true });
      logAuthEvent('ROLE_COMPUTATION_ERROR', { userId: user._id }, error, user._id);
      
      // Fallback to basic role computation
      const adminRoles = ['admin', 'superadmin'];
      const superRoles = ['superadmin'];
      const isAdminRole = user.role ? adminRoles.includes(user.role) : false;
      const isSuperRole = user.role ? superRoles.includes(user.role) : false;
      
      setIsAdmin(isAdminRole);
      setIsSuperUser(isSuperRole);

      // Create fallback UserRole object
      const permissions: string[] = [];
      if (isSuperRole) {
        permissions.push('system_admin', 'manage_admins', 'view_admin_dashboard', 'manage_events', 'manage_members', 'update_own_profile', 'read_profile');
      } else if (isAdminRole) {
        permissions.push('view_admin_dashboard', 'manage_events', 'manage_members', 'update_own_profile', 'read_profile');
      } else {
        permissions.push('update_own_profile', 'read_profile');
      }

      setUserRole({
        role: (isSuperRole ? 'superuser' : isAdminRole ? 'admin' : 'user') as UserRole['role'],
        permissions,
        isVerified: false,
        lastVerified: new Date(),
      });

      logAuthEvent('ROLE_COMPUTED_FALLBACK', { 
        userId: user._id,
        role: user.role, 
        isAdmin: isAdminRole, 
        isSuperUser: isSuperRole, 
        permissions,
        error: error.message
      }, undefined, user._id);
    }
  }, []);

  const clearAuthTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const setAuthTimeout = () => {
    clearAuthTimeout();
    timeoutRef.current = setTimeout(() => {
      logAuthEvent('AUTH_TIMEOUT', { timeoutMs: AUTH_TIMEOUT_MS });
      setAuthState(prev => ({
        ...prev,
        hasTimedOut: true,
        isLoading: false,
        error: createAuthError('Authentication timed out', 'AUTH_TIMEOUT'),
      }));
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 0,
      }));
    }, AUTH_TIMEOUT_MS);
  };

  const resetAuthState = () => {
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasTimedOut: false,
      error: null,
      retryCount: 0,
    });
    setUserRole(null);
    setIsAdmin(false);
    setIsSuperUser(false);
    setLoadingState({
      isLoading: false,
      progress: 0,
      stage: 'complete',
      timeoutAt: null,
    });
  };

  const handleAuthSuccess = async (user: CurrentUser, sessionData?: any) => {
    logAuthEvent('AUTH_SUCCESS', { userId: user._id, email: user.email, role: user.role });
    
    clearAuthTimeout();
    clearRetryTimeout();
    
    // Clear any connection errors on successful auth
    setConnectionError(null);
    
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
      hasTimedOut: false,
      error: null,
      retryCount: 0,
    });
    
    // Compute roles with enhanced verification
    await computeRoles(user);
    
    // Cache authentication state for offline use
    // Note: userRole will be set by computeRoles, so we'll cache it after
    setTimeout(() => {
      if (userRole) {
        cacheAuthState(user, userRole);
        logAuthEvent('AUTH_STATE_CACHED_FOR_OFFLINE', { 
          userId: user._id,
          role: userRole.role 
        });
      }
    }, 100);
    
    // Persist session data for future restoration
    persistSessionData(user, sessionData);
    
    updateLoadingProgress('complete', 100);
  };

  const handleAuthError = (error: any, context?: Record<string, any>) => {
    // Generate connection-specific error with troubleshooting steps
    const connError = generateConnectionError(error);
    setConnectionError(connError);
    
    const authError = createAuthError(
      connError.message,
      error.code,
      { ...context, originalError: error, connectionError: connError }
    );
    
    logAuthEvent('AUTH_ERROR_WITH_NETWORK_CONTEXT', { 
      ...context, 
      networkState,
      connectionError: connError 
    }, error);
    
    clearAuthTimeout();
    
    setAuthState(prev => ({
      ...prev,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: authError,
    }));
    
    setUserRole(null);
    setIsAdmin(false);
    setIsSuperUser(false);
    setLoadingState({
      isLoading: false,
      progress: 0,
      stage: 'complete',
      timeoutAt: null,
    });

    // If it's a network error and we have cached state, try to use it
    if (connError.type === 'network' || connError.type === 'timeout') {
      const cached = getCachedAuthState();
      if (cached) {
        logAuthEvent('USING_CACHED_STATE_FOR_OFFLINE', {
          userId: cached.user?._id,
          cacheAge: Date.now() - cached.timestamp.getTime()
        });
        
        setAuthState(prev => ({
          ...prev,
          user: cached.user,
          isAuthenticated: true,
          error: createAuthError(
            'Using cached data due to connection issues. Some features may be limited.',
            'OFFLINE_MODE',
            { cached: true }
          ),
        }));
        
        setUserRole(cached.userRole);
        
        // Compute admin flags from cached role
        const isAdminRole = cached.userRole?.role === 'admin' || 
          cached.userRole?.permissions?.includes('view_admin_dashboard');
        const isSuperRole = cached.userRole?.permissions?.includes('system_admin');
        
        setIsAdmin(isAdminRole);
        setIsSuperUser(isSuperRole);
      }
      
      // Start automatic reconnection for network errors
      if (connError.canRetry) {
        startReconnection();
      }
    }
  };

  // Enhanced cleanup for inconsistent session state with comprehensive validation
  const cleanupInconsistentSession = useCallback(async () => {
    logAuthEvent('CLEANUP_INCONSISTENT_SESSION_START');
    
    try {
      // Get storage info before cleanup for debugging
      const storageInfo = storageManager.current.getStorageInfo();
      logAuthEvent('STORAGE_INFO_BEFORE_CLEANUP', storageInfo);
      
      // Clear all session-related storage comprehensively
      const keysToRemove = [
        'supabase.auth.token',
        'auth.session',
        'auth.session.backup',
        'auth.user',
        'auth.user.minimal',
        'auth.metadata',
        'accessToken', // From authApi
      ];
      
      keysToRemove.forEach(key => {
        storageManager.current.removeItem(key);
      });
      
      // Clear access token using authApi
      clearAccessToken();
      
      // Sign out from Supabase to ensure clean state
      try {
        await supabase.auth.signOut();
        logAuthEvent('SUPABASE_SIGNOUT_SUCCESS');
      } catch (signOutError) {
        logAuthEvent('SUPABASE_SIGNOUT_ERROR', {}, signOutError);
      }
      
      // Clean up memory storage
      storageManager.current.cleanup();
      
      // Reset auth state
      resetAuthState();
      
      // Dispatch cleanup event for other components
      const cleanupEvent = new CustomEvent('authSessionCleanup', {
        detail: { timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(cleanupEvent);
      
      logAuthEvent('CLEANUP_INCONSISTENT_SESSION_SUCCESS');
    } catch (error: any) {
      logAuthEvent('CLEANUP_INCONSISTENT_SESSION_ERROR', {}, error);
      // Force reset even if cleanup fails
      resetAuthState();
    }
  }, []);

  // Periodic session validation to detect and cleanup inconsistent states
  const validateAndCleanupSession = useCallback(async () => {
    logAuthEvent('PERIODIC_SESSION_VALIDATION_START');
    
    try {
      const supabaseSession = storageManager.current.getItem('supabase.auth.token');
      const authSession = storageManager.current.getItem('auth.session');
      const storedUser = storageManager.current.getItem('auth.user');
      const metadata = storageManager.current.getItem('auth.metadata');
      
      let inconsistencyDetected = false;
      const issues: string[] = [];
      
      // Check for session data without user data
      if ((supabaseSession || authSession) && !storedUser) {
        issues.push('session_without_user');
        inconsistencyDetected = true;
      }
      
      // Check for user data without session data
      if (storedUser && !supabaseSession && !authSession) {
        issues.push('user_without_session');
        inconsistencyDetected = true;
      }
      
      // Check metadata consistency
      if (metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata);
          const lastPersisted = new Date(parsedMetadata.lastPersisted);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastPersisted.getTime()) / (1000 * 60 * 60);
          
          // If metadata is very old (>48 hours), consider it stale
          if (hoursDiff > 48) {
            issues.push('stale_metadata');
            inconsistencyDetected = true;
          }
        } catch (error) {
          issues.push('corrupted_metadata');
          inconsistencyDetected = true;
        }
      }
      
      // Validate session structure if present
      if (authSession) {
        if (!validateSession(authSession)) {
          issues.push('invalid_session_structure');
          inconsistencyDetected = true;
        }
      }
      
      if (inconsistencyDetected) {
        logAuthEvent('SESSION_INCONSISTENCY_DETECTED', { issues });
        await cleanupInconsistentSession();
      } else {
        logAuthEvent('SESSION_VALIDATION_PASSED');
      }
      
    } catch (error: any) {
      logAuthEvent('PERIODIC_SESSION_VALIDATION_ERROR', {}, error);
    }
  }, [cleanupInconsistentSession]);

  // Enhanced session persistence with backup strategies
  const persistSessionData = useCallback((user: CurrentUser, sessionData?: any) => {
    try {
      const userData = {
        ...user,
        lastLogin: new Date().toISOString(),
        sessionId: crypto.randomUUID(),
      };
      
      const sessionInfo = {
        ...sessionData,
        timestamp: new Date().toISOString(),
        userId: user._id,
        sessionId: userData.sessionId,
        version: '1.0', // For future migration compatibility
      };
      
      // Primary storage attempt
      storageManager.current.setItem('auth.user', JSON.stringify(userData));
      
      if (sessionData) {
        storageManager.current.setItem('auth.session', JSON.stringify(sessionInfo));
        
        // Create backup session data in case primary fails
        storageManager.current.setItem('auth.session.backup', JSON.stringify({
          userId: user._id,
          timestamp: sessionInfo.timestamp,
          sessionId: userData.sessionId,
          access_token: sessionData.access_token,
        }));
      }
      
      // Store session metadata for validation
      storageManager.current.setItem('auth.metadata', JSON.stringify({
        lastPersisted: new Date().toISOString(),
        userId: user._id,
        storageType: storageManager.current.isAvailable.localStorage ? 'localStorage' : 
                     storageManager.current.isAvailable.sessionStorage ? 'sessionStorage' : 'memory',
      }));
      
      logAuthEvent('SESSION_DATA_PERSISTED_ENHANCED', {
        userId: user._id,
        sessionId: userData.sessionId,
        hasSessionData: !!sessionData,
        storageType: storageManager.current.isAvailable.localStorage ? 'localStorage' : 
                     storageManager.current.isAvailable.sessionStorage ? 'sessionStorage' : 'memory',
      });
    } catch (error: any) {
      logAuthEvent('SESSION_PERSIST_ERROR', { userId: user._id }, error);
      
      // Fallback: try to persist minimal data
      try {
        storageManager.current.setItem('auth.user.minimal', JSON.stringify({
          _id: user._id,
          email: user.email,
          role: user.role,
          timestamp: new Date().toISOString(),
        }));
        logAuthEvent('SESSION_MINIMAL_PERSIST_SUCCESS', { userId: user._id });
      } catch (fallbackError: any) {
        logAuthEvent('SESSION_MINIMAL_PERSIST_FAILED', { userId: user._id }, fallbackError);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    const performanceId = startMeasurement('auth_refresh', 'auth', { operation: 'refresh' });
    logAuthEvent('REFRESH_START');
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    updateLoadingProgress('auth', 10);
    setAuthTimeout();

    try {
      updateLoadingProgress('profile', 50);
      
      const current = await getCurrentUser();
      
      updateLoadingProgress('dashboard', 90);
      await handleAuthSuccess(current);
      
      endMeasurement(performanceId, { success: true, userId: current._id });
      
    } catch (error: any) {
      endMeasurement(performanceId, { success: false, error: error.message });
      logAuthEvent('REFRESH_ERROR', { operation: 'refresh' }, error);
      
      // Check if this is an inconsistent state scenario
      const storedSession = storageManager.current.getItem('supabase.auth.token');
      if (storedSession && !validateSession(storedSession)) {
        logAuthEvent('INCONSISTENT_SESSION_DETECTED');
        await cleanupInconsistentSession();
      } else {
        handleAuthError(error, { operation: 'refresh' });
      }
    }
  }, [computeRoles, persistSessionData, cleanupInconsistentSession]);

  // Enhanced error recovery methods
  const executeWithRecoveryWrapper = useCallback(async (
    operation: () => Promise<any>,
    operationId?: string
  ): Promise<RecoveryResult<any>> => {
    const opId = operationId || `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: OperationContext = {
      operationId: opId,
      operationType: 'auth',
      userId: authState.user?._id,
      metadata: {
        component: 'AuthContext',
        timestamp: new Date().toISOString(),
      }
    };

    return executeWithRecovery(operation, context, undefined, {
      enableAutoRetry: true,
      enableFallbackAuth: true,
      enableOfflineMode: true,
      enableGracefulDegradation: true,
      userInitiatedRecovery: true,
    });
  }, [authState.user]);

  const initiateRecoveryWrapper = useCallback(async (
    action: 'retry' | 'refresh' | 'reset' | 'clear_cache' | 'force_logout'
  ): Promise<RecoveryResult> => {
    logAuthEvent('USER_INITIATED_RECOVERY_FROM_CONTEXT', { action });
    
    try {
      const result = await initiateUserRecovery('auth', action);
      
      // Handle specific recovery actions that affect auth state
      if (result.success) {
        switch (action) {
          case 'refresh':
            await refresh();
            break;
          case 'reset':
          case 'force_logout':
            resetAuthState();
            break;
          case 'clear_cache':
            clearCachedAuthState();
            break;
        }
      }
      
      return result;
    } catch (error) {
      logAuthEvent('USER_INITIATED_RECOVERY_ERROR', { action }, error);
      return {
        success: false,
        error: error as Error,
        recoveryMethod: 'user_initiated',
        attemptsUsed: 1,
        fallbackUsed: false,
        offlineMode: false,
      };
    }
  }, [refresh]);

  const registerFallbackMethodWrapper = useCallback((method: () => Promise<any>) => {
    registerFallbackAuthMethod(method);
    logAuthEvent('FALLBACK_METHOD_REGISTERED_IN_CONTEXT');
  }, []);

  const retry = useCallback(async () => {
    if (authState.retryCount >= MAX_RETRY_ATTEMPTS) {
      logAuthEvent('MAX_RETRIES_REACHED', { retryCount: authState.retryCount });
      
      // Try error recovery instead of giving up
      const recoveryResult = await executeWithRecoveryWrapper(refresh, 'auth_retry_recovery');
      
      if (recoveryResult.success) {
        logAuthEvent('RETRY_RECOVERY_SUCCESS', { 
          retryCount: authState.retryCount,
          recoveryMethod: recoveryResult.recoveryMethod 
        });
        return;
      } else {
        setAuthState(prev => ({
          ...prev,
          error: createAuthError('Maximum retry attempts reached and recovery failed', 'MAX_RETRIES_RECOVERY_FAILED'),
        }));
        return;
      }
    }

    logAuthEvent('RETRY_ATTEMPT', { retryCount: authState.retryCount + 1 });
    
    setAuthState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      hasTimedOut: false,
    }));

    // Use error recovery for retry with exponential backoff
    const recoveryResult = await executeWithRecoveryWrapper(
      refresh, 
      `auth_retry_${authState.retryCount + 1}`
    );

    if (!recoveryResult.success) {
      // If recovery also failed, fall back to traditional retry with delay
      clearRetryTimeout();
      retryTimeoutRef.current = setTimeout(() => {
        refresh();
      }, RETRY_DELAY_MS * (authState.retryCount + 1)); // Exponential backoff
    }
  }, [authState.retryCount, refresh, executeWithRecoveryWrapper]);

  const logout = useCallback(async () => {
    logAuthEvent('LOGOUT_START');
    
    try {
      await supabase.auth.signOut();
      clearAccessToken();
      
      // Clear session data using storage manager
      storageManager.current.removeItem('supabase.auth.token');
      storageManager.current.removeItem('auth.session');
      storageManager.current.removeItem('auth.user');
      
      resetAuthState();
      logAuthEvent('LOGOUT_SUCCESS');
      
    } catch (error: any) {
      logAuthEvent('LOGOUT_ERROR', {}, error);
      // Even if logout fails, clear local state
      resetAuthState();
    }
    
    clearAuthTimeout();
    clearRetryTimeout();
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null, hasTimedOut: false }));
  }, []);

  // Enhanced role management methods
  const refreshRole = useCallback(async () => {
    if (!authState.user) {
      logAuthEvent('REFRESH_ROLE_NO_USER');
      return;
    }

    logAuthEvent('REFRESH_ROLE_START', { userId: authState.user._id });
    
    try {
      await computeRoles(authState.user);
      logAuthEvent('REFRESH_ROLE_SUCCESS', { userId: authState.user._id });
    } catch (error: any) {
      logAuthEvent('REFRESH_ROLE_ERROR', { userId: authState.user._id }, error);
    }
  }, [authState.user, computeRoles]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userRole) return false;
    return userRole.permissions.includes(permission);
  }, [userRole]);

  const reVerifyPermissions = useCallback(async (permission: string = 'view_admin_dashboard'): Promise<boolean> => {
    if (!authState.user) {
      logAuthEvent('REVERIFY_PERMISSIONS_NO_USER', { permission });
      return false;
    }

    logAuthEvent('REVERIFY_PERMISSIONS_START', { 
      userId: authState.user._id, 
      permission 
    });

    try {
      const { reVerifyAdminPermissions } = await import('@/utils/roleManagement');
      const result = await reVerifyAdminPermissions(permission);
      
      logAuthEvent('REVERIFY_PERMISSIONS_RESULT', { 
        userId: authState.user._id, 
        permission,
        hasPermission: result.hasPermission,
        fallbackApplied: result.fallbackApplied
      });

      // If permissions changed, refresh role data
      if (result.hasPermission !== hasPermission(permission)) {
        await refreshRole();
      }

      return result.hasPermission;
    } catch (error: any) {
      logAuthEvent('REVERIFY_PERMISSIONS_ERROR', { 
        userId: authState.user._id, 
        permission 
      }, error);
      return false;
    }
  }, [authState.user, hasPermission, refreshRole]);

  // Enhanced session restoration with comprehensive fallback strategies
  const restoreSession = useCallback(async () => {
    logAuthEvent('SESSION_RESTORE_START', {
      storageAvailability: storageManager.current.isAvailable
    });
    
    try {
      // Try to get session from multiple sources with priority order
      const supabaseSession = storageManager.current.getItem('supabase.auth.token');
      const authSession = storageManager.current.getItem('auth.session');
      const backupSession = storageManager.current.getItem('auth.session.backup');
      const storedUser = storageManager.current.getItem('auth.user');
      const minimalUser = storageManager.current.getItem('auth.user.minimal');
      const metadata = storageManager.current.getItem('auth.metadata');
      
      logAuthEvent('SESSION_DATA_RETRIEVED_COMPREHENSIVE', {
        hasSupabaseSession: !!supabaseSession,
        hasAuthSession: !!authSession,
        hasBackupSession: !!backupSession,
        hasStoredUser: !!storedUser,
        hasMinimalUser: !!minimalUser,
        hasMetadata: !!metadata
      });

      // Validate metadata first to check session integrity
      let metadataValid = false;
      if (metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata);
          const lastPersisted = new Date(parsedMetadata.lastPersisted);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastPersisted.getTime()) / (1000 * 60 * 60);
          
          // Consider metadata valid if less than 24 hours old
          metadataValid = hoursDiff < 24;
          logAuthEvent('SESSION_METADATA_VALIDATION', { 
            hoursDiff, 
            valid: metadataValid,
            storageType: parsedMetadata.storageType 
          });
        } catch (error: any) {
          logAuthEvent('SESSION_METADATA_PARSE_ERROR', {}, error);
        }
      }

      // Validate session data with fallback chain
      let validSession = null;
      let sessionSource = null;
      
      // Priority 1: Supabase session
      if (supabaseSession && validateSession(supabaseSession)) {
        validSession = supabaseSession;
        sessionSource = 'supabase';
        logAuthEvent('SUPABASE_SESSION_VALID');
      }
      // Priority 2: Auth session
      else if (authSession && validateSession(authSession)) {
        validSession = authSession;
        sessionSource = 'auth';
        logAuthEvent('AUTH_SESSION_VALID');
      }
      // Priority 3: Backup session
      else if (backupSession && validateSession(backupSession)) {
        validSession = backupSession;
        sessionSource = 'backup';
        logAuthEvent('BACKUP_SESSION_VALID');
      }

      if (validSession && metadataValid) {
        // Attempt to restore user state
        try {
          await refresh();
          logAuthEvent('SESSION_RESTORE_SUCCESS', { sessionSource });
        } catch (refreshError: any) {
          logAuthEvent('SESSION_RESTORE_REFRESH_FAILED', { sessionSource }, refreshError);
          
          // Try fallback restoration with minimal user data
          if (minimalUser) {
            try {
              const parsedMinimalUser = JSON.parse(minimalUser);
              logAuthEvent('ATTEMPTING_MINIMAL_USER_RESTORE', { userId: parsedMinimalUser._id });
              
              // Set minimal auth state to allow user to continue
              setAuthState({
                user: parsedMinimalUser,
                isLoading: false,
                isAuthenticated: true,
                hasTimedOut: false,
                error: createAuthError('Session partially restored. Please refresh to restore full functionality.', 'PARTIAL_RESTORE'),
                retryCount: 0,
              });
              
              // Set basic role permissions
              setUserRole({
                role: parsedMinimalUser.role === 'admin' || parsedMinimalUser.role === 'superadmin' ? 'admin' : 'user',
                permissions: parsedMinimalUser.role === 'admin' || parsedMinimalUser.role === 'superadmin' 
                  ? ['view_admin_dashboard', 'update_own_profile', 'read_profile']
                  : ['update_own_profile', 'read_profile'],
                isVerified: false,
                lastVerified: new Date(),
              });
              
              setLoadingState({
                isLoading: false,
                progress: 100,
                stage: 'complete',
                timeoutAt: null,
              });
              
              logAuthEvent('MINIMAL_USER_RESTORE_SUCCESS', { userId: parsedMinimalUser._id });
              return;
            } catch (minimalRestoreError: any) {
              logAuthEvent('MINIMAL_USER_RESTORE_FAILED', {}, minimalRestoreError);
            }
          }
          
          // Session exists but refresh failed - inconsistent state
          await cleanupInconsistentSession();
        }
      } else {
        logAuthEvent('NO_VALID_SESSION', { 
          hasValidSession: !!validSession, 
          metadataValid,
          sessionSource 
        });
        
        // Clean up any invalid session data
        if (supabaseSession || authSession || backupSession) {
          logAuthEvent('CLEANING_INVALID_SESSION_DATA');
          await cleanupInconsistentSession();
        }
        
        // Set loading to false since there's no session to restore
        setAuthState(prev => ({ ...prev, isLoading: false }));
        setLoadingState(prev => ({ ...prev, isLoading: false, stage: 'complete' }));
      }
    } catch (error: any) {
      logAuthEvent('SESSION_RESTORE_ERROR', {}, error);
      
      // Final fallback: try to restore from any available user data
      try {
        const minimalUser = storageManager.current.getItem('auth.user.minimal');
        if (minimalUser) {
          const parsedMinimalUser = JSON.parse(minimalUser);
          logAuthEvent('EMERGENCY_RESTORE_ATTEMPT', { userId: parsedMinimalUser._id });
          
          setAuthState({
            user: parsedMinimalUser,
            isLoading: false,
            isAuthenticated: false, // Mark as not authenticated to force re-login
            hasTimedOut: false,
            error: createAuthError('Session corrupted. Please log in again.', 'SESSION_CORRUPTED'),
            retryCount: 0,
          });
          
          setLoadingState({
            isLoading: false,
            progress: 0,
            stage: 'complete',
            timeoutAt: null,
          });
          
          return;
        }
      } catch (emergencyError: any) {
        logAuthEvent('EMERGENCY_RESTORE_FAILED', {}, emergencyError);
      }
      
      await cleanupInconsistentSession();
    }
  }, [refresh, cleanupInconsistentSession]);

  useEffect(() => {
    logAuthEvent('AUTH_PROVIDER_MOUNT');
    
    // Initialize error recovery system with auth-specific handlers
    registerDegradationHandler('auth', async () => ({
      user: null,
      isAuthenticated: false,
      message: 'Authentication service unavailable - operating in limited mode'
    }));

    // Register default fallback authentication methods
    registerFallbackAuthMethod(async () => {
      const cachedState = getCachedAuthState();
      if (cachedState && cachedState.user) {
        return {
          user: cachedState.user,
          userRole: cachedState.userRole,
          source: 'cached_fallback',
          limited: true
        };
      }
      return null;
    });

    registerFallbackAuthMethod(async () => {
      const minimalUser = storageManager.current.getItem('auth.user.minimal');
      if (minimalUser) {
        try {
          const userData = JSON.parse(minimalUser);
          return {
            user: userData,
            source: 'minimal_fallback',
            limited: true
          };
        } catch (error) {
          logAuthEvent('MINIMAL_USER_FALLBACK_PARSE_ERROR', {}, error);
        }
      }
      return null;
    });
    
    // Subscribe to network state changes
    networkUnsubscribeRef.current = subscribeToNetworkChanges((newNetworkState) => {
      setNetworkState(newNetworkState);
      
      logAuthEvent('NETWORK_STATE_CHANGED', {
        isOnline: newNetworkState.isOnline,
        isSupabaseConnected: newNetworkState.isSupabaseConnected,
        quality: newNetworkState.connectionQuality,
        reconnectAttempts: newNetworkState.reconnectAttempts
      });
      
      // If we just came back online and have a user, try to refresh
      if (newNetworkState.isOnline && newNetworkState.isSupabaseConnected && authState.user) {
        logAuthEvent('RECONNECTED_REFRESHING_AUTH');
        refresh().catch(error => {
          logAuthEvent('RECONNECT_REFRESH_FAILED', {}, error);
        });
      }
      
      // If we went offline, clear any connection errors since they're no longer relevant
      if (!newNetworkState.isOnline) {
        setConnectionError(null);
      }
    });
    
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuthEvent('SUPABASE_AUTH_STATE_CHANGE', { 
        event, 
        hasSession: !!session, 
        userEmail: session?.user?.email,
        sessionValid: session ? validateSession(session) : false,
        networkState: networkState
      });
      
      if (session?.user) {
        // Validate session before proceeding
        if (validateSession(session)) {
          try {
            await refresh();
          } catch (error: any) {
            logAuthEvent('AUTH_STATE_CHANGE_REFRESH_ERROR', { event }, error);
            
            // If refresh fails, it might be an inconsistent state or network issue
            if (networkState.isOnline) {
              await cleanupInconsistentSession();
            } else {
              // We're offline, try to use cached state
              const cached = getCachedAuthState();
              if (cached) {
                logAuthEvent('USING_CACHED_STATE_OFFLINE_AUTH_CHANGE', {
                  userId: cached.user?._id
                });
                
                setAuthState(prev => ({
                  ...prev,
                  user: cached.user,
                  isAuthenticated: true,
                  error: createAuthError(
                    'Offline mode: Using cached authentication data',
                    'OFFLINE_MODE'
                  ),
                }));
                
                setUserRole(cached.userRole);
              }
            }
          }
        } else {
          logAuthEvent('INVALID_SESSION_IN_AUTH_STATE_CHANGE', { event });
          await cleanupInconsistentSession();
        }
      } else {
        // No session - clear user data and check for cleanup
        logAuthEvent('NO_SESSION_IN_AUTH_STATE_CHANGE', { event });
        
        // Clean up any remaining session data
        const hasStoredData = !!(
          storageManager.current.getItem('supabase.auth.token') ||
          storageManager.current.getItem('auth.session') ||
          storageManager.current.getItem('auth.user')
        );
        
        if (hasStoredData) {
          logAuthEvent('CLEANING_ORPHANED_SESSION_DATA');
          storageManager.current.removeItem('supabase.auth.token');
          storageManager.current.removeItem('auth.session');
          storageManager.current.removeItem('auth.user');
        }
        
        // Clear cached auth state when logging out
        clearCachedAuthState();
        
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          isAuthenticated: false,
          hasTimedOut: false,
          error: null,
          retryCount: 0,
        }));
        setUserRole(null);
        setIsAdmin(false);
        setIsSuperUser(false);
        setLoadingState({
          isLoading: false,
          progress: 0,
          stage: 'complete',
          timeoutAt: null,
        });
      }
    });

    // Initial session restoration
    restoreSession();

    // Set up periodic session validation (every 5 minutes)
    const validationInterval = setInterval(() => {
      validateAndCleanupSession();
    }, 5 * 60 * 1000);

    // Set up storage cleanup (every 30 minutes)
    const cleanupInterval = setInterval(() => {
      storageManager.current.cleanup();
    }, 30 * 60 * 1000);

    return () => {
      logAuthEvent('AUTH_PROVIDER_UNMOUNT');
      subscription.unsubscribe();
      clearAuthTimeout();
      clearRetryTimeout();
      clearInterval(validationInterval);
      clearInterval(cleanupInterval);
      
      // Unsubscribe from network changes
      if (networkUnsubscribeRef.current) {
        networkUnsubscribeRef.current();
      }
      
      // Stop any ongoing reconnection attempts
      stopReconnection();
    };
  }, [refresh, restoreSession, cleanupInconsistentSession, validateAndCleanupSession]);

  const value: AuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    isAdmin,
    isSuperUser,
    isAuthenticated: authState.isAuthenticated,
    hasTimedOut: authState.hasTimedOut,
    error: authState.error,
    retryCount: authState.retryCount,
    loadingState,
    userRole,
    refresh,
    logout,
    clearError,
    retry,
    refreshRole,
    hasPermission,
    reVerifyPermissions,
    validateAndCleanupSession,
    getStorageInfo: () => storageManager.current.getStorageInfo(),
    // Network connectivity properties
    networkState,
    connectionError,
    isOffline: !networkState.isOnline || !networkState.isSupabaseConnected,
    startReconnection,
    stopReconnection,
    // Error recovery properties
    executeWithRecovery: executeWithRecoveryWrapper,
    initiateRecovery: initiateRecoveryWrapper,
    registerFallbackMethod: registerFallbackMethodWrapper,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};