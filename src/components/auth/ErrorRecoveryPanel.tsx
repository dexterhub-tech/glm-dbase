/**
 * Error Recovery Panel Component
 * 
 * Provides user interface for error recovery options including retry,
 * refresh, reset, and other recovery actions.
 */

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Trash2, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useErrorRecovery, type UseErrorRecoveryOptions } from '@/hooks/useErrorRecovery';
import { logUIEvent } from '@/utils/comprehensiveLogging';

interface ErrorRecoveryPanelProps {
  error?: Error | null;
  operationType?: 'auth' | 'database' | 'network' | 'ui' | 'system';
  showAdvancedOptions?: boolean;
  onRecoverySuccess?: () => void;
  onRecoveryFailure?: (error: Error) => void;
  className?: string;
}

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  error,
  operationType = 'auth',
  showAdvancedOptions = false,
  onRecoverySuccess,
  onRecoveryFailure,
  className = '',
}) => {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const recoveryOptions: UseErrorRecoveryOptions = {
    operationType,
    autoRetry: true,
    enableFallback: true,
    enableOfflineMode: true,
    enableGracefulDegradation: true,
    onRecoverySuccess: (result) => {
      logUIEvent('RECOVERY_PANEL_SUCCESS', 'ErrorRecoveryPanel', {
        operationType,
        recoveryMethod: result.recoveryMethod,
        attemptsUsed: result.attemptsUsed
      });
      
      setActionInProgress(null);
      if (onRecoverySuccess) {
        onRecoverySuccess();
      }
    },
    onRecoveryFailure: (err) => {
      logUIEvent('RECOVERY_PANEL_FAILURE', 'ErrorRecoveryPanel', {
        operationType,
        error: err.message
      }, err);
      
      setActionInProgress(null);
      if (onRecoveryFailure) {
        onRecoveryFailure(err);
      }
    },
  };

  const { state, actions, stats } = useErrorRecovery(recoveryOptions);

  const handleAction = async (actionName: string, actionFn: () => Promise<void>) => {
    setActionInProgress(actionName);
    
    try {
      await actionFn();
    } catch (err) {
      console.error(`Recovery action ${actionName} failed:`, err);
    }
  };

  const getErrorSeverity = (error: Error | null): 'low' | 'medium' | 'high' => {
    if (!error) return 'low';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return 'medium';
    }
    
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'high';
    }
    
    return 'low';
  };

  const getRecoveryRecommendations = (error: Error | null, operationType: string): string[] => {
    const recommendations: string[] = [];
    
    if (!error) {
      recommendations.push('No specific error detected');
      return recommendations;
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      recommendations.push('Check your internet connection');
      recommendations.push('Try refreshing the page');
      if (operationType === 'auth') {
        recommendations.push('Use offline mode if available');
      }
    }
    
    if (message.includes('timeout')) {
      recommendations.push('The operation timed out');
      recommendations.push('Try again with a stable connection');
      recommendations.push('Clear browser cache if the issue persists');
    }
    
    if (message.includes('authentication') || message.includes('unauthorized')) {
      recommendations.push('Your session may have expired');
      recommendations.push('Try refreshing your authentication');
      recommendations.push('Log out and log back in if needed');
    }
    
    if (message.includes('database') || message.includes('query')) {
      recommendations.push('Database service may be temporarily unavailable');
      recommendations.push('Try again in a few moments');
      recommendations.push('Use cached data if available');
    }

    if (recommendations.length === 0) {
      recommendations.push('Try refreshing the page');
      recommendations.push('Clear browser cache and cookies');
      recommendations.push('Contact support if the issue persists');
    }
    
    return recommendations;
  };

  const currentError = error || state.lastError;
  const severity = getErrorSeverity(currentError);
  const recommendations = getRecoveryRecommendations(currentError, operationType);
  const isRecovering = state.isRecovering || actionInProgress !== null;

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Error Recovery</CardTitle>
          {state.isOffline && (
            <Badge variant="secondary" className="ml-auto">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          {state.isDegraded && (
            <Badge variant="outline" className="ml-auto">
              Limited Mode
            </Badge>
          )}
        </div>
        <CardDescription>
          {currentError ? (
            `${operationType.charAt(0).toUpperCase() + operationType.slice(1)} error detected. Choose a recovery option below.`
          ) : (
            'Recovery options are available to help resolve issues.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Information */}
        {currentError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Error Details:</div>
                <div className="text-sm text-muted-foreground">{currentError.message}</div>
                {state.recoveryMethod && (
                  <div className="text-sm">
                    <span className="font-medium">Last recovery method:</span> {state.recoveryMethod}
                  </div>
                )}
                {state.attemptsUsed > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Attempts used:</span> {state.attemptsUsed}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recommendations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Basic Recovery Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Recovery Actions</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isRecovering || !state.canRetry}
              onClick={() => handleAction('retry', actions.retryLastOperation)}
              className="justify-start"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${actionInProgress === 'retry' ? 'animate-spin' : ''}`} />
              {actionInProgress === 'retry' ? 'Retrying...' : 'Retry Operation'}
            </Button>

            {operationType === 'auth' && (
              <Button
                variant="outline"
                size="sm"
                disabled={isRecovering}
                onClick={() => handleAction('refresh', actions.refreshAuth)}
                className="justify-start"
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${actionInProgress === 'refresh' ? 'animate-spin' : ''}`} />
                {actionInProgress === 'refresh' ? 'Refreshing...' : 'Refresh Auth'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={isRecovering}
              onClick={() => window.location.reload()}
              className="justify-start"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isRecovering}
              onClick={actions.clearError}
              className="justify-start"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Error
            </Button>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Advanced Recovery Options</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRecovering}
                  onClick={() => handleAction('reset', actions.resetState)}
                  className="justify-start"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${actionInProgress === 'reset' ? 'animate-spin' : ''}`} />
                  {actionInProgress === 'reset' ? 'Resetting...' : 'Reset Application State'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRecovering}
                  onClick={() => handleAction('clearCache', actions.clearCaches)}
                  className="justify-start"
                >
                  <Trash2 className={`h-4 w-4 mr-2 ${actionInProgress === 'clearCache' ? 'animate-spin' : ''}`} />
                  {actionInProgress === 'clearCache' ? 'Clearing...' : 'Clear All Caches'}
                </Button>

                {operationType === 'auth' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isRecovering}
                    onClick={() => handleAction('forceLogout', actions.forceLogout)}
                    className="justify-start"
                  >
                    <LogOut className={`h-4 w-4 mr-2 ${actionInProgress === 'forceLogout' ? 'animate-spin' : ''}`} />
                    {actionInProgress === 'forceLogout' ? 'Logging out...' : 'Force Logout'}
                  </Button>
                )}

                {state.isRecovering && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={actions.abortCurrentOperation}
                    className="justify-start"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Abort Current Operation
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Toggle Advanced Options */}
        {!showAdvancedOptions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
        )}

        {/* Recovery Statistics */}
        {showAdvanced && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recovery Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{stats.activeOperations}</div>
                  <div className="text-muted-foreground">Active Operations</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{stats.registeredFallbackMethods}</div>
                  <div className="text-muted-foreground">Fallback Methods</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{stats.registeredDegradationHandlers}</div>
                  <div className="text-muted-foreground">Degradation Handlers</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Network Status */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {state.isOffline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Offline Mode</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span>Online</span>
              </>
            )}
          </div>
          
          {state.isDegraded && (
            <Badge variant="outline" size="sm">
              Degraded Mode
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorRecoveryPanel;