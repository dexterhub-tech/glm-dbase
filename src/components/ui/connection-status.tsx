/**
 * Connection Status Component
 * 
 * Displays network connectivity status and provides troubleshooting
 * information when connection issues occur.
 * 
 * Requirements: 2.1, 2.5
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  HelpCircle
} from 'lucide-react';
import { useNetworkConnectivity } from '@/hooks/useNetworkConnectivity';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  showTroubleshooting?: boolean;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showDetails = false,
  showTroubleshooting = false,
  compact = false
}) => {
  const {
    networkState,
    isOnline,
    isOffline,
    connectionQuality,
    latency,
    reconnectAttempts,
    connectionError,
    hasConnectionError,
    startReconnection,
    stopReconnection,
    getConnectionStatusMessage,
    getTroubleshootingSteps,
    shouldShowOfflineMessage
  } = useNetworkConnectivity();

  // Don't show anything if connection is good and no details requested
  if (!showDetails && !shouldShowOfflineMessage() && !hasConnectionError) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (hasConnectionError || !networkState.isSupabaseConnected) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    if (reconnectAttempts > 0) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusVariant = () => {
    if (!isOnline || hasConnectionError) {
      return 'destructive';
    }
    
    if (!networkState.isSupabaseConnected || reconnectAttempts > 0) {
      return 'default';
    }
    
    return 'default';
  };

  const getQualityBadge = () => {
    if (!isOnline || !networkState.isSupabaseConnected) {
      return null;
    }

    const qualityConfig = {
      excellent: { variant: 'default' as const, color: 'bg-green-500' },
      good: { variant: 'secondary' as const, color: 'bg-yellow-500' },
      poor: { variant: 'outline' as const, color: 'bg-red-500' },
      offline: { variant: 'destructive' as const, color: 'bg-gray-500' }
    };

    const config = qualityConfig[connectionQuality];
    
    return (
      <Badge variant={config.variant} className="ml-2">
        <div className={cn("w-2 h-2 rounded-full mr-1", config.color)} />
        {connectionQuality}
        {latency && ` (${latency}ms)`}
      </Badge>
    );
  };

  const troubleshootingSteps = getTroubleshootingSteps();

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground">
          {getConnectionStatusMessage()}
        </span>
        {getQualityBadge()}
        {reconnectAttempts > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={stopReconnection}
            className="h-6 px-2"
          >
            Cancel
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Alert variant={getStatusVariant()}>
        <div className="flex items-start space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <AlertTitle className="flex items-center">
              {getConnectionStatusMessage()}
              {getQualityBadge()}
            </AlertTitle>
            
            {showDetails && (
              <AlertDescription className="mt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Browser:</strong> {isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div>
                    <strong>Server:</strong> {networkState.isSupabaseConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  {latency && (
                    <div>
                      <strong>Latency:</strong> {latency}ms
                    </div>
                  )}
                  {reconnectAttempts > 0 && (
                    <div>
                      <strong>Reconnect attempts:</strong> {reconnectAttempts}
                    </div>
                  )}
                </div>
              </AlertDescription>
            )}

            {(hasConnectionError || !networkState.isSupabaseConnected) && (
              <div className="mt-3 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startReconnection}
                  disabled={reconnectAttempts > 0}
                >
                  {reconnectAttempts > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Connection
                    </>
                  )}
                </Button>
                
                {reconnectAttempts > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopReconnection}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {showTroubleshooting && troubleshootingSteps.length > 0 && (
              <AlertDescription className="mt-4">
                <div className="flex items-center mb-2">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <strong>Troubleshooting Steps:</strong>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {troubleshootingSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </AlertDescription>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default ConnectionStatus;