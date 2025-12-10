import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface LoadingStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'loading' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface DashboardLoadingManagerProps {
  stages: LoadingStage[];
  onStageUpdate?: (stageId: string, updates: Partial<LoadingStage>) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  timeout?: number;
  showDetails?: boolean;
  allowSkip?: boolean;
  children?: React.ReactNode;
}

interface LoadingManagerState {
  currentStageIndex: number;
  overallProgress: number;
  hasTimedOut: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isComplete: boolean;
  startTime: Date;
}

export const DashboardLoadingManager: React.FC<DashboardLoadingManagerProps> = ({
  stages,
  onStageUpdate,
  onComplete,
  onError,
  timeout = 30000, // 30 seconds default
  showDetails = true,
  allowSkip = true,
  children,
}) => {
  const [state, setState] = useState<LoadingManagerState>({
    currentStageIndex: 0,
    overallProgress: 0,
    hasTimedOut: false,
    hasError: false,
    errorMessage: null,
    isComplete: false,
    startTime: new Date(),
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate overall progress based on stage completion
  const calculateOverallProgress = useCallback((stageIndex: number, stageProgress: number) => {
    const completedStages = stageIndex;
    const currentStageWeight = stageProgress / 100;
    const totalProgress = (completedStages + currentStageWeight) / stages.length * 100;
    return Math.min(Math.max(totalProgress, 0), 100);
  }, [stages.length]);

  // Update stage status and progress
  const updateStage = useCallback((stageId: string, updates: Partial<LoadingStage>) => {
    const stageIndex = stages.findIndex(stage => stage.id === stageId);
    if (stageIndex === -1) return;

    // Log stage update
    console.log(`[Dashboard Loading Manager] Stage update:`, {
      stageId,
      stageIndex,
      updates,
      timestamp: new Date().toISOString(),
    });

    // Update stage in parent component
    if (onStageUpdate) {
      onStageUpdate(stageId, updates);
    }

    // Update local state if this is the current stage
    if (stageIndex === state.currentStageIndex) {
      const newProgress = updates.progress ?? stages[stageIndex].progress;
      const overallProgress = calculateOverallProgress(stageIndex, newProgress);

      setState(prev => ({
        ...prev,
        overallProgress,
      }));

      // Move to next stage if current stage is completed
      if (updates.status === 'completed') {
        const nextStageIndex = stageIndex + 1;
        
        if (nextStageIndex >= stages.length) {
          // All stages completed
          setState(prev => ({
            ...prev,
            isComplete: true,
            overallProgress: 100,
          }));
          
          if (onComplete) {
            onComplete();
          }
        } else {
          // Move to next stage
          setState(prev => ({
            ...prev,
            currentStageIndex: nextStageIndex,
          }));
        }
      }

      // Handle stage error
      if (updates.status === 'error') {
        const errorMsg = updates.error || `Stage ${stages[stageIndex].name} failed`;
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: errorMsg,
        }));

        if (onError) {
          onError(errorMsg);
        }
      }
    }
  }, [stages, state.currentStageIndex, calculateOverallProgress, onStageUpdate, onComplete, onError]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    console.warn('[Dashboard Loading Manager] Loading timeout reached');
    
    setState(prev => ({
      ...prev,
      hasTimedOut: true,
      hasError: true,
      errorMessage: 'Loading timed out. Some components may not be available.',
    }));

    if (onError) {
      onError('Loading timeout');
    }
  }, [onError]);

  // Skip loading and continue
  const handleSkip = useCallback(() => {
    console.log('[Dashboard Loading Manager] User skipped loading');
    
    setState(prev => ({
      ...prev,
      isComplete: true,
      overallProgress: 100,
    }));

    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Retry loading
  const handleRetry = useCallback(() => {
    console.log('[Dashboard Loading Manager] Retrying loading');
    
    setState({
      currentStageIndex: 0,
      overallProgress: 0,
      hasTimedOut: false,
      hasError: false,
      errorMessage: null,
      isComplete: false,
      startTime: new Date(),
    });
  }, []);

  // Set up timeout
  useEffect(() => {
    if (timeout > 0 && !state.isComplete && !state.hasTimedOut) {
      timeoutRef.current = setTimeout(handleTimeout, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, state.isComplete, state.hasTimedOut, handleTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stageTimeoutRef.current) {
        clearTimeout(stageTimeoutRef.current);
      }
    };
  }, []);

  // If loading is complete, render children
  if (state.isComplete && !state.hasError) {
    return <>{children}</>;
  }

  const currentStage = stages[state.currentStageIndex];
  const elapsedTime = Math.floor((new Date().getTime() - state.startTime.getTime()) / 1000);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 rounded-lg">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {state.hasError ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : state.isComplete ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {state.hasError ? 'Loading Error' : 'Loading Dashboard'}
          </h3>
          
          <p className="text-gray-600">
            {state.hasError 
              ? state.errorMessage
              : currentStage 
                ? currentStage.description
                : 'Preparing your dashboard...'
            }
          </p>
        </div>

        {/* Progress Bar */}
        {!state.hasError && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(state.overallProgress)}%</span>
            </div>
            <Progress value={state.overallProgress} className="w-full" />
          </div>
        )}

        {/* Stage Details */}
        {showDetails && !state.hasError && currentStage && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {state.currentStageIndex + 1}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{currentStage.name}</h4>
                <p className="text-sm text-gray-600">{currentStage.description}</p>
              </div>
            </div>
            
            {/* Stage Progress */}
            <Progress value={currentStage.progress} className="w-full mb-2" />
            
            {/* Elapsed Time */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Elapsed: {elapsedTime}s</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {state.hasError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {state.errorMessage}
              {state.hasTimedOut && (
                <div className="mt-2 text-sm">
                  You can continue with limited functionality or try again.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {state.hasError && (
            <Button
              onClick={handleRetry}
              className="flex items-center gap-2"
              variant="default"
            >
              <Loader2 className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          {(allowSkip || state.hasTimedOut) && !state.isComplete && (
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex items-center gap-2"
            >
              Continue Anyway
            </Button>
          )}
        </div>

        {/* Stage List (for debugging) */}
        {showDetails && process.env.NODE_ENV === 'development' && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Debug Info</summary>
            <div className="mt-2 space-y-1">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex justify-between">
                  <span>{stage.name}</span>
                  <span>{stage.status} ({stage.progress}%)</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default DashboardLoadingManager;