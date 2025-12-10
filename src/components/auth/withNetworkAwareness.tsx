/**
 * Higher-Order Component for Network Awareness
 * 
 * Wraps components with network connectivity awareness, providing
 * offline handling and connection status display.
 * 
 * Requirements: 2.1, 2.5
 */

import React, { ComponentType } from 'react';
import { useNetworkConnectivity } from '@/hooks/useNetworkConnectivity';
import ConnectionStatus from '@/components/ui/connection-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NetworkAwarenessOptions {
  showConnectionStatus?: boolean;
  showOfflineMessage?: boolean;
  showTroubleshooting?: boolean;
  blockWhenOffline?: boolean;
  fallbackComponent?: ComponentType<any>;
}

interface NetworkAwarenessProps {
  networkAwareness?: NetworkAwarenessOptions;
}

/**
 * HOC that adds network awareness to components
 */
export function withNetworkAwareness<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: NetworkAwarenessOptions = {}
) {
  const {
    showConnectionStatus = true,
    showOfflineMessage = true,
    showTroubleshooting = false,
    blockWhenOffline = false,
    fallbackComponent: FallbackComponent
  } = options;

  const NetworkAwareComponent: React.FC<P & NetworkAwarenessProps> = (props) => {
    const {
      isOnline,
      isOffline,
      networkState,
      hasConnectionError,
      shouldShowOfflineMessage,
      startReconnection,
      getConnectionStatusMessage,
      getTroubleshootingSteps
    } = useNetworkConnectivity();

    // If component should be blocked when offline and we're offline
    if (blockWhenOffline && isOffline) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }

      return (
        <div className="p-6 text-center">
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-4">
                <p>This feature requires an internet connection.</p>
                <p className="text-sm text-muted-foreground">
                  {getConnectionStatusMessage()}
                </p>
                
                {showTroubleshooting && (
                  <div className="text-left">
                    <p className="font-medium mb-2">Troubleshooting steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {getTroubleshootingSteps().map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={startReconnection}
                  disabled={networkState.reconnectAttempts > 0}
                >
                  {networkState.reconnectAttempts > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div>
        {/* Connection status display */}
        {showConnectionStatus && (shouldShowOfflineMessage() || hasConnectionError) && (
          <div className="mb-4">
            <ConnectionStatus 
              showTroubleshooting={showTroubleshooting}
              compact={false}
            />
          </div>
        )}

        {/* Offline message */}
        {showOfflineMessage && shouldShowOfflineMessage() && !showConnectionStatus && (
          <div className="mb-4">
            <Alert variant="default">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're currently offline. Some features may be limited.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Wrapped component */}
        <WrappedComponent {...props} />
      </div>
    );
  };

  NetworkAwareComponent.displayName = `withNetworkAwareness(${WrappedComponent.displayName || WrappedComponent.name})`;

  return NetworkAwareComponent;
}

/**
 * Offline fallback component
 */
export const OfflineFallback: React.FC<{ message?: string }> = ({ 
  message = "This feature is not available offline" 
}) => {
  const { startReconnection, networkState } = useNetworkConnectivity();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Offline</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button
        variant="outline"
        onClick={startReconnection}
        disabled={networkState.reconnectAttempts > 0}
      >
        {networkState.reconnectAttempts > 0 ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Reconnecting...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try to Reconnect
          </>
        )}
      </Button>
    </div>
  );
};

export default withNetworkAwareness;