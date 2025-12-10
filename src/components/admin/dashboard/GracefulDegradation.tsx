import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DegradationLevel {
  level: 'info' | 'warning' | 'error';
  message: string;
  impact: string;
  suggestions?: string[];
}

interface GracefulDegradationProps {
  componentName: string;
  degradationLevel: DegradationLevel;
  fallbackContent?: React.ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

const GracefulDegradation: React.FC<GracefulDegradationProps> = ({
  componentName,
  degradationLevel,
  fallbackContent,
  onRetry,
  onDismiss,
  showDetails = true,
}) => {
  const getIcon = () => {
    switch (degradationLevel.level) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getAlertClass = () => {
    switch (degradationLevel.level) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextClass = () => {
    switch (degradationLevel.level) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Degradation Notice */}
      <Alert className={getAlertClass()}>
        {getIcon()}
        <AlertDescription className={getTextClass()}>
          <div className="space-y-2">
            <div>
              <strong>{componentName} - {degradationLevel.level.toUpperCase()}:</strong> {degradationLevel.message}
            </div>
            
            <div>
              <strong>Impact:</strong> {degradationLevel.impact}
            </div>

            {degradationLevel.suggestions && degradationLevel.suggestions.length > 0 && (
              <div>
                <strong>Suggestions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {degradationLevel.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            {(onRetry || onDismiss) && (
              <div className="flex gap-2 mt-3">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className={`border-current ${getTextClass()}`}
                  >
                    Retry
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className={getTextClass()}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Fallback Content */}
      {fallbackContent && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Fallback Mode
            </CardTitle>
            <CardDescription>
              Basic functionality is available while the main component is unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fallbackContent}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {showDetails && process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          <summary className="cursor-pointer font-medium">Debug Information</summary>
          <div className="mt-2 space-y-1">
            <div><strong>Component:</strong> {componentName}</div>
            <div><strong>Degradation Level:</strong> {degradationLevel.level}</div>
            <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
            <div><strong>Has Fallback:</strong> {fallbackContent ? 'Yes' : 'No'}</div>
            <div><strong>Can Retry:</strong> {onRetry ? 'Yes' : 'No'}</div>
          </div>
        </details>
      )}
    </div>
  );
};

// Predefined degradation scenarios
export const DegradationScenarios = {
  COMPONENT_LOAD_FAILED: (componentName: string): DegradationLevel => ({
    level: 'error',
    message: 'Failed to load component',
    impact: 'This feature is temporarily unavailable',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the issue persists',
    ],
  }),

  COMPONENT_TIMEOUT: (componentName: string): DegradationLevel => ({
    level: 'warning',
    message: 'Component loading timed out',
    impact: 'Feature may be slow or unavailable',
    suggestions: [
      'Wait a moment and try again',
      'Check your network connection',
      'Use the basic version if available',
    ],
  }),

  NETWORK_ERROR: (componentName: string): DegradationLevel => ({
    level: 'warning',
    message: 'Network connectivity issues detected',
    impact: 'Some features may not work properly',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Use offline features if available',
    ],
  }),

  PERMISSION_DENIED: (componentName: string): DegradationLevel => ({
    level: 'info',
    message: 'Insufficient permissions for full functionality',
    impact: 'Limited features available based on your role',
    suggestions: [
      'Contact your administrator for access',
      'Use available features in the meantime',
    ],
  }),

  PARTIAL_FUNCTIONALITY: (componentName: string): DegradationLevel => ({
    level: 'info',
    message: 'Running in limited mode',
    impact: 'Core features are available, some advanced features may be disabled',
    suggestions: [
      'Basic functionality is still available',
      'Try refreshing to restore full functionality',
    ],
  }),
};

export default GracefulDegradation;