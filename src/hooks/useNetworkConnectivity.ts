/**
 * React Hook for Network Connectivity Management
 * 
 * Provides easy access to network connectivity state and functions
 * for React components that need to handle offline scenarios.
 * 
 * Requirements: 2.1, 2.5
 */

import { useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { NetworkState, ConnectionError } from '@/utils/networkConnectivity';

export interface UseNetworkConnectivityReturn {
  // Network state
  networkState: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
  isSupabaseConnected: boolean;
  connectionQuality: NetworkState['connectionQuality'];
  latency: number | null;
  reconnectAttempts: number;
  
  // Connection error information
  connectionError: ConnectionError | null;
  hasConnectionError: boolean;
  
  // Connection management
  startReconnection: () => void;
  stopReconnection: () => void;
  
  // Utility functions
  canMakeRequests: () => boolean;
  shouldShowOfflineMessage: () => boolean;
  getConnectionStatusMessage: () => string;
  getTroubleshootingSteps: () => string[];
}

/**
 * Hook for managing network connectivity in React components
 */
export const useNetworkConnectivity = (): UseNetworkConnectivityReturn => {
  const { 
    networkState, 
    connectionError, 
    isOffline,
    startReconnection,
    stopReconnection 
  } = useAuth();

  /**
   * Check if we can make network requests
   */
  const canMakeRequests = (): boolean => {
    return networkState.isOnline && networkState.isSupabaseConnected;
  };

  /**
   * Check if we should show offline message to user
   */
  const shouldShowOfflineMessage = (): boolean => {
    return !networkState.isOnline || 
           (!networkState.isSupabaseConnected && networkState.reconnectAttempts > 2);
  };

  /**
   * Get user-friendly connection status message
   */
  const getConnectionStatusMessage = (): string => {
    if (!networkState.isOnline) {
      return 'No internet connection detected';
    }
    
    if (!networkState.isSupabaseConnected) {
      if (networkState.reconnectAttempts > 0) {
        return `Reconnecting... (attempt ${networkState.reconnectAttempts})`;
      }
      return 'Unable to connect to server';
    }
    
    switch (networkState.connectionQuality) {
      case 'excellent':
        return 'Connected - Excellent connection';
      case 'good':
        return 'Connected - Good connection';
      case 'poor':
        return 'Connected - Slow connection';
      default:
        return 'Connected';
    }
  };

  /**
   * Get troubleshooting steps for current connection issue
   */
  const getTroubleshootingSteps = (): string[] => {
    if (connectionError) {
      return connectionError.troubleshootingSteps;
    }
    
    if (!networkState.isOnline) {
      return [
        'Check your internet connection',
        'Verify your WiFi or ethernet connection',
        'Try refreshing the page',
        'Contact your network administrator if the problem persists'
      ];
    }
    
    if (!networkState.isSupabaseConnected) {
      return [
        'The service may be temporarily unavailable',
        'Try refreshing the page in a few moments',
        'Check if other users are experiencing similar issues',
        'Contact support if the problem continues'
      ];
    }
    
    return [];
  };

  return {
    // Network state
    networkState,
    isOnline: networkState.isOnline,
    isOffline,
    isSupabaseConnected: networkState.isSupabaseConnected,
    connectionQuality: networkState.connectionQuality,
    latency: networkState.latency,
    reconnectAttempts: networkState.reconnectAttempts,
    
    // Connection error information
    connectionError,
    hasConnectionError: !!connectionError,
    
    // Connection management
    startReconnection,
    stopReconnection,
    
    // Utility functions
    canMakeRequests,
    shouldShowOfflineMessage,
    getConnectionStatusMessage,
    getTroubleshootingSteps,
  };
};

export default useNetworkConnectivity;