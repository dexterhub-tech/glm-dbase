/**
 * Error Boundary with Recovery Component
 * 
 * Enhanced error boundary that integrates with the error recovery system
 * to provide automatic and user-initiated recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ErrorRecoveryPanel from './ErrorRecoveryPanel';
import { logUIEvent, logSystemEvent } from '@/utils/comprehensiveLogging';
import { 
  executeWithRecovery,
  registerDegradationHandler,
  type OperationContext,
  type RecoveryResult
} from '@/utils/errorRecovery';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: (recoveryResult: RecoveryResult) => void;
  enableAutoRecovery?: boolean;
  operationType?: 'auth' | 'database' | 'network' | 'ui' | 'system';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  recoveryAttempts: number;
  lastRecoveryMethod: string | null;
  showRecoveryPanel: boolean;
}

class ErrorBoundaryWithRecovery extends Component<Props, State> {
  private recoveryTimeoutId: NodeJS.Timeout | null = null;
  private maxAutoRecoveryAttempts = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoveryAttempts: 0,
      lastRecoveryMethod: null,
      showRecoveryPanel: false,
    };

    // Register degradation handler for this component
    this.registerComponentDegradationHandler();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'UnknownComponent';
    
    logSystemEvent('ERROR_BOUNDARY_CAUGHT_ERROR', {
      componentName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }, error);

    this.setState({
      error,
      errorInfo,
    });

    // Call external error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt automatic recovery if enabled
    if (this.props.enableAutoRecovery && this.state.recoveryAttempts < this.maxAutoRecoveryAttempts) {
      this.attemptAutoRecovery(error);
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
    }
  }

  private registerComponentDegradationHandler = () => {
    const operationType = this.props.operationType || 'ui';
    const componentName = this.props.componentName || 'ErrorBoundary';

    registerDegradationHandler(operationType, async () => {
      logUIEvent('DEGRADATION_HANDLER_ACTIVATED', componentName, {
        operationType,
        hasError: this.state.hasError,
        recoveryAttempts: this.state.recoveryAttempts
      });

      return {
        component: 'ErrorBoundaryFallback',
        message: `${componentName} failed to load - showing fallback interface`,
        degraded: true,
      };
    });
  };

  private attemptAutoRecovery = async (error: Error) => {
    const componentName = this.props.componentName || 'UnknownComponent';
    const operationType = this.props.operationType || 'ui';

    logUIEvent('AUTO_RECOVERY_ATTEMPT', componentName, {
      attempt: this.state.recoveryAttempts + 1,
      maxAttempts: this.maxAutoRecoveryAttempts,
      error: error.message
    });

    this.setState({
      isRecovering: true,
      recoveryAttempts: this.state.recoveryAttempts + 1,
    });

    try {
      const context: OperationContext = {
        operationId: `error_boundary_recovery_${Date.now()}`,
        operationType,
        metadata: {
          componentName,
          errorMessage: error.message,
          recoveryAttempt: this.state.recoveryAttempts + 1,
        }
      };

      // Create a recovery operation that attempts to reset the component
      const recoveryOperation = async () => {
        // Simulate component recovery by waiting and then resetting state
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a re-render by resetting error state
        return { recovered: true };
      };

      const recoveryResult = await executeWithRecovery(
        recoveryOperation,
        context,
        {
          maxAttempts: 2,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryableErrors: ['timeout', 'network', 'temporary'],
        },
        {
          enableAutoRetry: true,
          enableFallbackAuth: false,
          enableOfflineMode: false,
          enableGracefulDegradation: true,
          userInitiatedRecovery: false,
        }
      );

      if (recoveryResult.success) {
        logUIEvent('AUTO_RECOVERY_SUCCESS', componentName, {
          attempt: this.state.recoveryAttempts,
          recoveryMethod: recoveryResult.recoveryMethod
        });

        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRecovering: false,
          lastRecoveryMethod: recoveryResult.recoveryMethod || 'auto',
        });

        if (this.props.onRecovery) {
          this.props.onRecovery(recoveryResult);
        }
      } else {
        logUIEvent('AUTO_RECOVERY_FAILED', componentName, {
          attempt: this.state.recoveryAttempts,
          error: recoveryResult.error?.message
        });

        this.setState({
          isRecovering: false,
          showRecoveryPanel: true,
        });
      }
    } catch (recoveryError) {
      logUIEvent('AUTO_RECOVERY_EXCEPTION', componentName, {
        attempt: this.state.recoveryAttempts,
        error: (recoveryError as Error).message
      }, recoveryError as Error);

      this.setState({
        isRecovering: false,
        showRecoveryPanel: true,
      });
    }
  };

  private handleManualRecovery = () => {
    logUIEvent('MANUAL_RECOVERY_INITIATED', this.props.componentName || 'ErrorBoundary');
    
    this.setState({
      showRecoveryPanel: true,
    });
  };

  private handleRecoverySuccess = () => {
    logUIEvent('MANUAL_RECOVERY_SUCCESS', this.props.componentName || 'ErrorBoundary');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      showRecoveryPanel: false,
      lastRecoveryMethod: 'manual',
    });
  };

  private handleRecoveryFailure = (error: Error) => {
    logUIEvent('MANUAL_RECOVERY_FAILED', this.props.componentName || 'ErrorBoundary', {
      error: error.message
    }, error);
  };

  private handleReload = () => {
    logUIEvent('ERROR_BOUNDARY_RELOAD', this.props.componentName || 'ErrorBoundary');
    window.location.reload();
  };

  private renderFallbackUI = () => {
    const { error, errorInfo, isRecovering, showRecoveryPanel, lastRecoveryMethod } = this.state;
    const componentName = this.props.componentName || 'Component';

    // If custom fallback is provided and we're not showing recovery panel
    if (this.props.fallback && !showRecoveryPanel) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          {/* Main Error Card */}
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">
                  {componentName} Error
                </CardTitle>
              </div>
              <CardDescription>
                An error occurred while rendering this component. 
                {lastRecoveryMethod && (
                  <span className="block mt-1 text-sm">
                    Last recovery method: {lastRecoveryMethod}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details */}
              {error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Error Details:</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <code className="text-sm text-destructive">
                      {error.message}
                    </code>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleManualRecovery}
                  disabled={isRecovering || showRecoveryPanel}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                  {isRecovering ? 'Recovering...' : 'Try Recovery'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReload}
                  disabled={isRecovering}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Development Info */}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Development Details
                  </summary>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {error?.stack}
                    </pre>
                    <pre className="text-xs overflow-auto mt-2">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Recovery Panel */}
          {showRecoveryPanel && (
            <ErrorRecoveryPanel
              error={error}
              operationType={this.props.operationType || 'ui'}
              showAdvancedOptions={true}
              onRecoverySuccess={this.handleRecoverySuccess}
              onRecoveryFailure={this.handleRecoveryFailure}
            />
          )}
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithRecovery;