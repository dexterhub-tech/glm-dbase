import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLoadingManager, { LoadingStage } from './DashboardLoadingManager';
import ComponentLoader from './ComponentLoader';
import FallbackDashboard from './FallbackDashboard';
import DashboardErrorBoundary from './DashboardErrorBoundary';

interface ComponentConfig {
  name: string;
  path: string;
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface DashboardState {
  isLoading: boolean;
  loadingStages: LoadingStage[];
  failedComponents: string[];
  loadedComponents: Set<string>;
  hasError: boolean;
  errorMessage: string | null;
}

const EnhancedDashboardContent: React.FC = () => {
  const { isSuperUser } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: true,
    loadingStages: [],
    failedComponents: [],
    loadedComponents: new Set(),
    hasError: false,
    errorMessage: null,
  });

  // Component configurations
  const componentConfigs: Record<string, ComponentConfig> = {
    '/admin/users': {
      name: 'UserManagement',
      path: '/admin/users',
      loader: () => import('@/components/admin/UserManagement'),
    },
    '/admin/events': {
      name: 'EventsManagement',
      path: '/admin/events',
      loader: () => import('@/components/admin/events/EventsManagement'),
    },
    '/admin/members': {
      name: 'MembersManager',
      path: '/admin/members',
      loader: () => import('@/components/admin/members/MembersManager'),
    },
    '/admin/pastors': {
      name: 'PastorsPage',
      path: '/admin/pastors',
      loader: () => import('@/components/admin/pastors/PastorsPage'),
    },
    '/admin/pastors/detail': {
      name: 'PastorDetail',
      path: '/admin/pastors/detail',
      loader: () => import('@/components/admin/pastors/PastorDetail'),
    },
    '/admin/system': {
      name: 'ProfileSyncManager',
      path: '/admin/system',
      loader: () => import('@/components/admin/ProfileSyncManager'),
    },
    '/admin/profile': {
      name: 'UserProfileView',
      path: '/admin/profile',
      loader: () => import('@/components/admin/profile/UserProfileView'),
    },
    '/admin/settings': {
      name: 'PlaceholderCard',
      path: '/admin/settings',
      loader: () => import('./PlaceholderCard'),
      props: { title: 'Settings', description: 'Manage church settings' },
    },
    '/admin': {
      name: 'DefaultDashboard',
      path: '/admin',
      loader: () => import('./DefaultDashboard'),
    },
  };

  // Initialize loading stages
  const initializeLoadingStages = useCallback(() => {
    const currentConfig = componentConfigs[path] || componentConfigs['/admin'];
    
    const stages: LoadingStage[] = [
      {
        id: 'auth-check',
        name: 'Authentication Check',
        description: 'Verifying user permissions...',
        progress: 0,
        status: 'pending',
      },
      {
        id: 'component-discovery',
        name: 'Component Discovery',
        description: 'Identifying required components...',
        progress: 0,
        status: 'pending',
      },
      {
        id: 'component-loading',
        name: 'Component Loading',
        description: `Loading ${currentConfig.name}...`,
        progress: 0,
        status: 'pending',
      },
      {
        id: 'render-preparation',
        name: 'Render Preparation',
        description: 'Preparing dashboard interface...',
        progress: 0,
        status: 'pending',
      },
    ];

    setDashboardState(prev => ({
      ...prev,
      loadingStages: stages,
      isLoading: true,
    }));

    return stages;
  }, [path]);

  // Update loading stage
  const updateLoadingStage = useCallback((stageId: string, updates: Partial<LoadingStage>) => {
    setDashboardState(prev => ({
      ...prev,
      loadingStages: prev.loadingStages.map(stage =>
        stage.id === stageId
          ? { ...stage, ...updates, startTime: updates.status === 'loading' ? new Date() : stage.startTime }
          : stage
      ),
    }));
  }, []);

  // Handle component loading success
  const handleComponentSuccess = useCallback((componentName: string) => {
    console.log(`[Enhanced Dashboard] Component loaded successfully: ${componentName}`);
    
    setDashboardState(prev => ({
      ...prev,
      loadedComponents: new Set([...prev.loadedComponents, componentName]),
    }));
  }, []);

  // Handle component loading error
  const handleComponentError = useCallback((error: Error, componentName: string) => {
    console.error(`[Enhanced Dashboard] Component failed to load: ${componentName}`, error);
    
    setDashboardState(prev => ({
      ...prev,
      failedComponents: [...prev.failedComponents, componentName],
      hasError: true,
      errorMessage: `Failed to load ${componentName}: ${error.message}`,
    }));
  }, []);

  // Complete loading process
  const handleLoadingComplete = useCallback(() => {
    console.log('[Enhanced Dashboard] Loading process completed');
    
    setDashboardState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  // Handle loading error
  const handleLoadingError = useCallback((error: string) => {
    console.error('[Enhanced Dashboard] Loading process failed:', error);
    
    setDashboardState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      errorMessage: error,
    }));
  }, []);

  // Retry loading
  const handleRetry = useCallback(() => {
    console.log('[Enhanced Dashboard] Retrying dashboard loading');
    
    setDashboardState(prev => ({
      ...prev,
      isLoading: true,
      failedComponents: [],
      loadedComponents: new Set(),
      hasError: false,
      errorMessage: null,
    }));

    // Restart loading process
    setTimeout(() => {
      initializeLoadingStages();
    }, 100);
  }, [initializeLoadingStages]);

  // Simulate loading process
  useEffect(() => {
    const stages = initializeLoadingStages();
    
    const runLoadingProcess = async () => {
      try {
        // Stage 1: Authentication Check
        updateLoadingStage('auth-check', { status: 'loading', progress: 0 });
        await new Promise(resolve => setTimeout(resolve, 500));
        updateLoadingStage('auth-check', { status: 'completed', progress: 100 });

        // Stage 2: Component Discovery
        updateLoadingStage('component-discovery', { status: 'loading', progress: 0 });
        await new Promise(resolve => setTimeout(resolve, 300));
        updateLoadingStage('component-discovery', { status: 'completed', progress: 100 });

        // Stage 3: Component Loading
        updateLoadingStage('component-loading', { status: 'loading', progress: 0 });
        await new Promise(resolve => setTimeout(resolve, 800));
        updateLoadingStage('component-loading', { status: 'completed', progress: 100 });

        // Stage 4: Render Preparation
        updateLoadingStage('render-preparation', { status: 'loading', progress: 0 });
        await new Promise(resolve => setTimeout(resolve, 400));
        updateLoadingStage('render-preparation', { status: 'completed', progress: 100 });

      } catch (error: any) {
        handleLoadingError(error.message);
      }
    };

    runLoadingProcess();
  }, [initializeLoadingStages, updateLoadingStage, handleLoadingError]);

  // Format unit name for display
  const formatUnitName = (name: string) => {
    if (!name) return '';

    if (name === 'cloventongues') {
      return 'Cloven Tongues';
    } else if (name.startsWith('3h')) {
      return name.replace('3h', '3H');
    }

    return name
      .split(/[^a-zA-Z0-9]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get current component configuration
  const getCurrentComponent = () => {
    // Handle unit paths
    if (path.startsWith('/admin/units/')) {
      const unitId = path.split('/').pop();
      const displayName = formatUnitName(unitId || '');
      return {
        name: 'UnitMembersView',
        loader: () => import('@/components/admin/units/UnitMembersView'),
        props: { unitId: unitId || '', unitName: displayName },
      };
    }

    // Handle pastor detail paths
    if (path.startsWith('/admin/pastors/') && path !== '/admin/pastors') {
      return componentConfigs['/admin/pastors/detail'];
    }

    // Return configured component or default
    return componentConfigs[path] || componentConfigs['/admin'];
  };

  // Show loading manager while loading
  if (dashboardState.isLoading) {
    return (
      <DashboardLoadingManager
        stages={dashboardState.loadingStages}
        onStageUpdate={updateLoadingStage}
        onComplete={handleLoadingComplete}
        onError={handleLoadingError}
        timeout={15000}
        showDetails={true}
        allowSkip={true}
      >
        <div className="p-4 md:w-[90%] mx-auto">
          {/* This will be shown when loading completes */}
        </div>
      </DashboardLoadingManager>
    );
  }

  // Show fallback dashboard if there are errors
  if (dashboardState.hasError && dashboardState.failedComponents.length > 0) {
    return (
      <FallbackDashboard
        error={dashboardState.errorMessage || undefined}
        missingComponents={dashboardState.failedComponents}
        onRetry={handleRetry}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  // Render the appropriate component
  const currentComponent = getCurrentComponent();

  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[Enhanced Dashboard] Dashboard error boundary caught error:', {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
        handleComponentError(error, 'Dashboard');
      }}
      showDetails={process.env.NODE_ENV === 'development'}
      fallback={
        <FallbackDashboard
          error="Dashboard component encountered an error"
          missingComponents={['Dashboard']}
          onRetry={handleRetry}
          onRefresh={() => window.location.reload()}
        />
      }
    >
      <div className="p-4 md:w-[90%] mx-auto">
        <ComponentLoader
          componentName={currentComponent.name}
          loadComponent={currentComponent.loader}
          props={currentComponent.props}
          timeout={10000}
          showErrorDetails={process.env.NODE_ENV === 'development'}
          onError={handleComponentError}
          onSuccess={handleComponentSuccess}
        />
      </div>
    </DashboardErrorBoundary>
  );
};

export default EnhancedDashboardContent;