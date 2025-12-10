import React from 'react';
import { useLocation } from 'react-router-dom';
import AuthGuard from './AuthGuard';
import { getRouteConfig } from '@/config/routeConfig';
import { logAuthEvent } from '@/utils/comprehensiveLogging';

interface WithRouteProtectionOptions {
  fallbackComponent?: React.ReactNode;
  showAccessDenied?: boolean;
  onAuthRequired?: (path: string, reason: string) => void;
  onAccessDenied?: (path: string, reason: string) => void;
  customRedirectPath?: string;
}

/**
 * Higher-order component that automatically applies route protection based on route configuration
 */
export function withRouteProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRouteProtectionOptions = {}
) {
  const ProtectedComponent: React.FC<P> = (props) => {
    const location = useLocation();
    const routeConfig = getRouteConfig(location.pathname);

    // Log HOC usage
    React.useEffect(() => {
      logAuthEvent('WITH_ROUTE_PROTECTION_APPLIED', {
        path: location.pathname,
        componentName: WrappedComponent.displayName || WrappedComponent.name,
        routeConfig
      });
    }, [location.pathname, routeConfig]);

    // If no route config, render component without protection (public route)
    if (!routeConfig || !routeConfig.requireAuth) {
      logAuthEvent('PUBLIC_ROUTE_NO_PROTECTION_NEEDED', {
        path: location.pathname,
        componentName: WrappedComponent.displayName || WrappedComponent.name
      });
      return <WrappedComponent {...props} />;
    }

    // Apply protection based on route configuration
    return (
      <AuthGuard
        requireAuth={routeConfig.requireAuth}
        requiredPermission={routeConfig.requiredPermission}
        requiredRole={routeConfig.requiredRole}
        redirectTo={options.customRedirectPath || routeConfig.redirectTo || '/auth/login'}
        reVerifyForAdmin={routeConfig.reVerifyForAdmin}
        fallbackComponent={options.fallbackComponent}
        showAccessDenied={options.showAccessDenied}
        onAuthRequired={() => {
          if (options.onAuthRequired) {
            options.onAuthRequired(location.pathname, 'Authentication required');
          }
        }}
        onAccessDenied={() => {
          if (options.onAccessDenied) {
            const reason = routeConfig.requiredRole 
              ? `Role "${routeConfig.requiredRole}" required`
              : routeConfig.requiredPermission 
                ? `Permission "${routeConfig.requiredPermission}" required`
                : 'Access denied';
            options.onAccessDenied(location.pathname, reason);
          }
        }}
      >
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withRouteProtection(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
}

/**
 * Hook to get current route protection status
 */
export function useRouteProtectionStatus() {
  const location = useLocation();
  const routeConfig = getRouteConfig(location.pathname);

  return {
    isProtected: !!routeConfig?.requireAuth,
    requiredPermission: routeConfig?.requiredPermission,
    requiredRole: routeConfig?.requiredRole,
    requiresReVerification: routeConfig?.reVerifyForAdmin,
    redirectPath: routeConfig?.redirectTo || '/auth/login',
    routeConfig
  };
}

export default withRouteProtection;