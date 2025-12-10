/**
 * Network Connectivity Detection and Management Utility
 * 
 * Provides comprehensive network connectivity detection, offline state management,
 * automatic reconnection mechanisms, and connection error handling with troubleshooting steps.
 * 
 * Requirements: 2.1, 2.5
 */

import { supabase } from "@/integrations/supabase/client";

export interface NetworkState {
  isOnline: boolean;
  isSupabaseConnected: boolean;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  latency: number | null;
}

export interface CachedState {
  user: any;
  userRole: any;
  timestamp: Date;
  expiresAt: Date;
}

export interface ConnectionError {
  type: 'network' | 'supabase' | 'timeout' | 'unknown';
  message: string;
  troubleshootingSteps: string[];
  canRetry: boolean;
  retryDelay: number;
}

// Network connectivity manager class
class NetworkConnectivityManager {
  private networkState: NetworkState = {
    isOnline: navigator.onLine,
    isSupabaseConnected: false,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    reconnectAttempts: 0,
    connectionQuality: 'offline',
    latency: null,
  };

  private cachedState: CachedState | null = null;
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private latencyCheckTimer: NodeJS.Timeout | null = null;

  // Configuration constants
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_BASE_DELAY = 1000; // 1 second
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly LATENCY_CHECK_INTERVAL = 60000; // 1 minute
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds

  constructor() {
    this.initializeNetworkListeners();
    this.startHealthChecks();
    this.startLatencyChecks();
    this.loadCachedState();
  }

  /**
   * Initialize network event listeners
   */
  private initializeNetworkListeners(): void {
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for visibility change to check connection when tab becomes active
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Listen for focus events to recheck connection
    window.addEventListener('focus', this.handleWindowFocus.bind(this));

    this.logNetworkEvent('NETWORK_LISTENERS_INITIALIZED', {
      initialOnlineState: navigator.onLine
    });
  }

  /**
   * Handle browser online event
   */
  private async handleOnline(): Promise<void> {
    this.logNetworkEvent('BROWSER_ONLINE_EVENT');
    
    this.networkState.isOnline = true;
    this.networkState.lastConnectedAt = new Date();
    
    // Reset reconnect attempts when coming back online
    this.networkState.reconnectAttempts = 0;
    
    // Check Supabase connectivity
    await this.checkSupabaseConnection();
    
    this.notifyListeners();
  }

  /**
   * Handle browser offline event
   */
  private handleOffline(): void {
    this.logNetworkEvent('BROWSER_OFFLINE_EVENT');
    
    this.networkState.isOnline = false;
    this.networkState.isSupabaseConnected = false;
    this.networkState.lastDisconnectedAt = new Date();
    this.networkState.connectionQuality = 'offline';
    this.networkState.latency = null;
    
    this.notifyListeners();
  }

  /**
   * Handle visibility change (tab becomes active/inactive)
   */
  private async handleVisibilityChange(): Promise<void> {
    if (!document.hidden) {
      this.logNetworkEvent('TAB_BECAME_ACTIVE');
      
      // Recheck connection when tab becomes active
      await this.checkConnectivity();
    }
  }

  /**
   * Handle window focus event
   */
  private async handleWindowFocus(): Promise<void> {
    this.logNetworkEvent('WINDOW_FOCUS_EVENT');
    
    // Recheck connection when window gains focus
    await this.checkConnectivity();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      if (this.networkState.isOnline) {
        await this.checkSupabaseConnection();
      }
    }, this.HEALTH_CHECK_INTERVAL);

    this.logNetworkEvent('HEALTH_CHECKS_STARTED', {
      interval: this.HEALTH_CHECK_INTERVAL
    });
  }

  /**
   * Start periodic latency checks
   */
  private startLatencyChecks(): void {
    this.latencyCheckTimer = setInterval(async () => {
      if (this.networkState.isOnline && this.networkState.isSupabaseConnected) {
        await this.measureLatency();
      }
    }, this.LATENCY_CHECK_INTERVAL);

    this.logNetworkEvent('LATENCY_CHECKS_STARTED', {
      interval: this.LATENCY_CHECK_INTERVAL
    });
  }

  /**
   * Check overall connectivity (browser + Supabase)
   */
  public async checkConnectivity(): Promise<NetworkState> {
    this.logNetworkEvent('CONNECTIVITY_CHECK_START');
    
    // Update browser online state
    this.networkState.isOnline = navigator.onLine;
    
    if (this.networkState.isOnline) {
      await this.checkSupabaseConnection();
    } else {
      this.networkState.isSupabaseConnected = false;
      this.networkState.connectionQuality = 'offline';
      this.networkState.latency = null;
    }
    
    this.notifyListeners();
    
    this.logNetworkEvent('CONNECTIVITY_CHECK_COMPLETE', {
      isOnline: this.networkState.isOnline,
      isSupabaseConnected: this.networkState.isSupabaseConnected,
      quality: this.networkState.connectionQuality
    });
    
    return { ...this.networkState };
  }

  /**
   * Check Supabase connection specifically
   */
  private async checkSupabaseConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Use a lightweight query to test connection
      const { error } = await Promise.race([
        supabase.from('profiles').select('count').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), this.CONNECTION_TIMEOUT)
        )
      ]) as any;
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      if (error) {
        this.logNetworkEvent('SUPABASE_CONNECTION_FAILED', { error: error.message });
        
        this.networkState.isSupabaseConnected = false;
        this.networkState.connectionQuality = 'offline';
        this.networkState.latency = null;
        
        return false;
      }
      
      this.logNetworkEvent('SUPABASE_CONNECTION_SUCCESS', { latency });
      
      this.networkState.isSupabaseConnected = true;
      this.networkState.latency = latency;
      this.networkState.lastConnectedAt = new Date();
      
      // Update connection quality based on latency
      this.updateConnectionQuality(latency);
      
      // Reset reconnect attempts on successful connection
      this.networkState.reconnectAttempts = 0;
      
      return true;
      
    } catch (error: any) {
      this.logNetworkEvent('SUPABASE_CONNECTION_ERROR', { error: error.message });
      
      this.networkState.isSupabaseConnected = false;
      this.networkState.connectionQuality = this.networkState.isOnline ? 'poor' : 'offline';
      this.networkState.latency = null;
      
      return false;
    }
  }

  /**
   * Measure connection latency
   */
  private async measureLatency(): Promise<number | null> {
    try {
      const startTime = Date.now();
      
      // Use a very lightweight query for latency measurement
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        return null;
      }
      
      const latency = Date.now() - startTime;
      this.networkState.latency = latency;
      this.updateConnectionQuality(latency);
      
      this.logNetworkEvent('LATENCY_MEASURED', { latency });
      
      return latency;
      
    } catch (error: any) {
      this.logNetworkEvent('LATENCY_MEASUREMENT_FAILED', { error: error.message });
      return null;
    }
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(latency: number): void {
    if (latency < 200) {
      this.networkState.connectionQuality = 'excellent';
    } else if (latency < 500) {
      this.networkState.connectionQuality = 'good';
    } else {
      this.networkState.connectionQuality = 'poor';
    }
  }

  /**
   * Cache current authentication state for offline use
   */
  public cacheState(user: any, userRole: any): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_EXPIRY_MS);
    
    this.cachedState = {
      user,
      userRole,
      timestamp: now,
      expiresAt,
    };
    
    // Persist to storage
    try {
      localStorage.setItem('network.cachedState', JSON.stringify(this.cachedState));
      this.logNetworkEvent('STATE_CACHED', {
        userId: user?._id,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error: any) {
      this.logNetworkEvent('STATE_CACHE_FAILED', { error: error.message });
    }
  }

  /**
   * Load cached state from storage
   */
  private loadCachedState(): void {
    try {
      const cached = localStorage.getItem('network.cachedState');
      if (cached) {
        const parsed = JSON.parse(cached);
        const expiresAt = new Date(parsed.expiresAt);
        
        if (expiresAt > new Date()) {
          this.cachedState = {
            ...parsed,
            timestamp: new Date(parsed.timestamp),
            expiresAt,
          };
          
          this.logNetworkEvent('CACHED_STATE_LOADED', {
            userId: this.cachedState.user?._id,
            age: Date.now() - this.cachedState.timestamp.getTime()
          });
        } else {
          // Expired cache
          localStorage.removeItem('network.cachedState');
          this.logNetworkEvent('CACHED_STATE_EXPIRED');
        }
      }
    } catch (error: any) {
      this.logNetworkEvent('CACHED_STATE_LOAD_FAILED', { error: error.message });
      localStorage.removeItem('network.cachedState');
    }
  }

  /**
   * Get cached state if available and not expired
   */
  public getCachedState(): CachedState | null {
    if (this.cachedState && this.cachedState.expiresAt > new Date()) {
      return { ...this.cachedState };
    }
    return null;
  }

  /**
   * Clear cached state
   */
  public clearCachedState(): void {
    this.cachedState = null;
    localStorage.removeItem('network.cachedState');
    this.logNetworkEvent('CACHED_STATE_CLEARED');
  }

  /**
   * Attempt automatic reconnection
   */
  public async attemptReconnection(): Promise<boolean> {
    if (this.networkState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logNetworkEvent('MAX_RECONNECT_ATTEMPTS_REACHED', {
        attempts: this.networkState.reconnectAttempts
      });
      return false;
    }

    this.networkState.reconnectAttempts++;
    
    this.logNetworkEvent('RECONNECTION_ATTEMPT', {
      attempt: this.networkState.reconnectAttempts,
      maxAttempts: this.MAX_RECONNECT_ATTEMPTS
    });

    const success = await this.checkConnectivity();
    
    if (success.isOnline && success.isSupabaseConnected) {
      this.logNetworkEvent('RECONNECTION_SUCCESS', {
        attempts: this.networkState.reconnectAttempts
      });
      return true;
    }

    // Schedule next reconnection attempt with exponential backoff
    const delay = this.RECONNECT_BASE_DELAY * Math.pow(2, this.networkState.reconnectAttempts - 1);
    const maxDelay = 30000; // Max 30 seconds
    const actualDelay = Math.min(delay, maxDelay);

    this.logNetworkEvent('SCHEDULING_NEXT_RECONNECTION', {
      delay: actualDelay,
      attempt: this.networkState.reconnectAttempts
    });

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnection();
    }, actualDelay);

    return false;
  }

  /**
   * Start automatic reconnection process
   */
  public startReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.logNetworkEvent('RECONNECTION_STARTED');
    this.attemptReconnection();
  }

  /**
   * Stop automatic reconnection process
   */
  public stopReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.logNetworkEvent('RECONNECTION_STOPPED');
  }

  /**
   * Generate connection error with troubleshooting steps
   */
  public generateConnectionError(error: any): ConnectionError {
    let errorType: ConnectionError['type'] = 'unknown';
    let message = 'Connection failed';
    let troubleshootingSteps: string[] = [];
    let canRetry = true;
    let retryDelay = 5000;

    // Analyze error to determine type and appropriate response
    if (!navigator.onLine) {
      errorType = 'network';
      message = 'No internet connection detected';
      troubleshootingSteps = [
        'Check your internet connection',
        'Verify your WiFi or ethernet connection',
        'Try refreshing the page',
        'Contact your network administrator if the problem persists'
      ];
      retryDelay = 10000;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch')) {
      errorType = 'timeout';
      message = 'Connection timed out';
      troubleshootingSteps = [
        'Check your internet connection speed',
        'Try refreshing the page',
        'Clear your browser cache and cookies',
        'Disable browser extensions temporarily',
        'Try using a different browser or device'
      ];
      retryDelay = 15000;
    } else if (error?.message?.includes('supabase') || error?.code?.startsWith('PGRST')) {
      errorType = 'supabase';
      message = 'Database connection failed';
      troubleshootingSteps = [
        'The service may be temporarily unavailable',
        'Try refreshing the page in a few moments',
        'Check if other users are experiencing similar issues',
        'Contact support if the problem continues'
      ];
      retryDelay = 20000;
    } else {
      errorType = 'unknown';
      message = error?.message || 'An unexpected connection error occurred';
      troubleshootingSteps = [
        'Try refreshing the page',
        'Check your internet connection',
        'Clear your browser cache',
        'Try using a different browser',
        'Contact support if the issue persists'
      ];
    }

    this.logNetworkEvent('CONNECTION_ERROR_GENERATED', {
      type: errorType,
      message,
      originalError: error?.message,
      canRetry,
      retryDelay
    });

    return {
      type: errorType,
      message,
      troubleshootingSteps,
      canRetry,
      retryDelay
    };
  }

  /**
   * Subscribe to network state changes
   */
  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener({ ...this.networkState });
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const state = { ...this.networkState };
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error: any) {
        this.logNetworkEvent('LISTENER_ERROR', { error: error.message });
      }
    });
  }

  /**
   * Get current network state
   */
  public getState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Log network events
   */
  private logNetworkEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event,
      networkState: { ...this.networkState },
      data,
    };
    
    console.log(`[NETWORK] ${event}:`, logData);
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToLoggingService(logData);
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.latencyCheckTimer) {
      clearInterval(this.latencyCheckTimer);
    }

    // Clear listeners
    this.listeners.clear();

    this.logNetworkEvent('NETWORK_MANAGER_DESTROYED');
  }
}

// Create singleton instance
export const networkManager = new NetworkConnectivityManager();

// Export utility functions for easier use
export const checkConnectivity = () => networkManager.checkConnectivity();
export const cacheAuthState = (user: any, userRole: any) => networkManager.cacheState(user, userRole);
export const getCachedAuthState = () => networkManager.getCachedState();
export const clearCachedAuthState = () => networkManager.clearCachedState();
export const startReconnection = () => networkManager.startReconnection();
export const stopReconnection = () => networkManager.stopReconnection();
export const generateConnectionError = (error: any) => networkManager.generateConnectionError(error);
export const subscribeToNetworkChanges = (listener: (state: NetworkState) => void) => 
  networkManager.subscribe(listener);
export const getNetworkState = () => networkManager.getState();