import React, { Suspense, lazy, useState, useEffect } from 'react';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ComponentLoaderProps {
  componentName: string;
  loadComponent: () => Promise<{ default: React.ComponentType<any> }>;
  fallbackComponent?: React.ComponentType<any>;
  props?: Record<string, any>;
  timeout?: number;
  showErrorDetails?: boolean;
  onError?: (error: Error, componentName: string) => void;
  onSuccess?: (componentName: string) => void;
}

interface LoadingState {
  isLoading: boolean;
  hasTimedOut: boolean;
  error: Error | null;
  retryCount: number;
}

const ComponentLoader: React.FC<ComponentLoaderProps> = ({
  componentName,
  loadComponent,
  fallbackComponent: FallbackComponent,
  props = {},
  timeout = 10000,
  showErrorDetails = false,
  onError,
  onSuccess,
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    hasTimedOut: false,
    error: null,
    retryCount: 0,
  });

  const [LazyComponent, setLazyComponent] = useState<React.ComponentType<any> | null>(null);

  // Create lazy component with error handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const loadComponentWithTimeout = async () => {
      console.log(`[Component Loader] Loading component: ${componentName}`);
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        hasTimedOut: false,
      }));

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            console.warn(`[Component Loader] Component loading timed out: ${componentName}`);
            setLoadingState(prev => ({
              ...prev,
              isLoading: false,
              hasTimedOut: true,
              error: new Error(`Component loading timed out after ${timeout}ms`),
            }));
          }
        }, timeout);
      }

      try {
        const componentModule = await loadComponent();
        
        if (!isCancelled) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          console.log(`[Component Loader] Component loaded successfully: ${componentName}`);
          
          setLazyComponent(() => componentModule.default);
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            error: null,
          }));

          if (onSuccess) {
            onSuccess(componentName);
          }
        }
      } catch (error: any) {
        if (!isCancelled) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          console.error(`[Component Loader] Failed to load component: ${componentName}`, error);
          
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            error,
          }));

          if (onError) {
            onError(error, componentName);
          }
        }
      }
    };

    loadComponentWithTimeout();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [componentName, loadComponent, timeout, onError, onSuccess, loadingState.retryCount]);

  const handleRetry = () => {
    console.log(`[Component Loader] Retrying component load: ${componentName} (attempt ${loadingState.retryCount + 1})`);
    
    setLoadingState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));
  };

  const handleUseFallback = () => {
    console.log(`[Component Loader] Using fallback for component: ${componentName}`);
    
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
    }));
  };

  // Show loading state
  if (loadingState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading {componentName}...</p>
      </div>
    );
  }

  // Show error state
  if (loadingState.error && !LazyComponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load {componentName}
            </h3>
            <p className="text-gray-600 mb-4">
              {loadingState.hasTimedOut 
                ? 'The component took too long to load.'
                : 'An error occurred while loading this component.'
              }
            </p>
          </div>

          {showErrorDetails && loadingState.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Error:</strong> {loadingState.error.message}
                {loadingState.retryCount > 0 && (
                  <div className="mt-1">
                    <strong>Retry attempts:</strong> {loadingState.retryCount}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              className="flex items-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            {FallbackComponent && (
              <Button
                onClick={handleUseFallback}
                variant="outline"
              >
                Use Basic Version
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render the loaded component or fallback
  const ComponentToRender = LazyComponent || FallbackComponent;
  
  if (!ComponentToRender) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <p className="text-gray-500">Component not available</p>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`[Component Loader] Runtime error in ${componentName}:`, {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
        
        if (onError) {
          onError(error, componentName);
        }
      }}
      showDetails={showErrorDetails}
      fallback={
        FallbackComponent ? (
          <div className="p-4">
            <Alert className="border-yellow-200 bg-yellow-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                The main {componentName} component encountered an error. Using fallback version.
              </AlertDescription>
            </Alert>
            <FallbackComponent {...props} />
          </div>
        ) : undefined
      }
    >
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-[200px] p-4">
            <LoadingSpinner size="lg" text={`Rendering ${componentName}...`} />
          </div>
        }
      >
        <ComponentToRender {...props} />
      </Suspense>
    </DashboardErrorBoundary>
  );
};

export default ComponentLoader;