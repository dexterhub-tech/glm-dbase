import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/loading-spinner';
import { logAuthEvent } from '@/utils/comprehensiveLogging';

interface RouteConfig {
  path: string;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  redirectTo?: string;
  reVerifyForAdmin?: boolean;
}

interface RouteGuardProps {
  children: React.ReactNode;
  routes: RouteConfig[];
  defaultRedirect?: string;
  onUnauthorizedAccess?: (path: string, reason: string) => void;
}

interface RouteGuardState {
  isVerifying: boolean;
  isAuthorized: boolean;
  shouldRedirect: boolean;
  redirectPath?: string;
  error?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  routes,
  defaultRedirect = '/auth/login',
  onUnauthorizedAccess
}) => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasPermission, 
    reVerifyPermissions,
    userRole,
    hasTimedOut,
    error: authError
  } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [guardState, setGuardState] = useState<RouteGuardState>({
    isVerifying: true,
    isAuthorized: false,
    shouldRedirect: false
  });

  const findRouteConfig = useCallback((path: string): RouteConfig | null => {
    // Find exact match first
    let config = routes.find(route => route.path === path);
    
    if (!config) {
      // Find pattern match (for dynamic routes)
      config = routes.find(route => {
        if (route.path.includes(':')) {
          const pattern = route.path.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(path);
        }
        
        // Check for wildcard matches
        if (route.path.endsWith('/*')) {
          const basePath = route.path.slice(0, -2);
          return path.startsWith(basePath);
        }
        
        return false;
      });
    }
    
    return config || null;
  }, [routes]);

  const verifyRouteAccess = useCallback(async () => {
    const currentPath = location.pathname;
    
    logAuthEvent('ROUTE_GUARD_VERIFICATION_START', {
      path: currentPath,
      userId: user?._id,
      isAuthenticated
    });

    setGuardState(prev => ({ ...prev, isVerifying: true }));

    try {
      const routeConfig = findRouteConfig(currentPath);
      
      // If no route config found, allow access (public route)
      if (!routeConfig) {
        logAuthEvent('ROUTE_GUARD_PUBLIC_ROUTE', { path: currentPath });
        setGuardState({
          isVerifying: false,
          isAuthorized: true,
          shouldRedirect: false
        });
        return;
      }

      // If route doesn't require auth, allow access
      if (!routeConfig.requireAuth) {
        logAuthEvent('ROUTE_GUARD_NO_AUTH_REQUIRED', { 
          path: currentPath,
          routeConfig 
        });
        setGuardState({
          isVerifying: false,
          isAuthorized: true,
          shouldRedirect: false
        });
        return;
      }

      // Check authentication
      if (!isAuthenticated || !user) {
        const reason = 'Authentication required';
        logAuthEvent('ROUTE_GUARD_AUTH_REQUIRED', { 
          path: currentPath,
          reason,
          redirectTo: routeConfig.redirectTo || defaultRedirect
        });
        
        setGuardState({
          isVerifying: false,
          isAuthorized: false,
          shouldRedirect: true,
          redirectPath: routeConfig.redirectTo || defaultRedirect,
          error: reason
        });
        
        if (onUnauthorizedAccess) {
          onUnauthorizedAccess(currentPath, reason);
        }
        return;
      }

      // Check role requirements
      if (routeConfig.requiredRole && userRole?.role !== routeConfig.requiredRole) {
        const reason = `Role "${routeConfig.requiredRole}" required`;
        logAuthEvent('ROUTE_GUARD_ROLE_DENIED', {
          path: currentPath,
          requiredRole: routeConfig.requiredRole,
          userRole: userRole?.role,
          userId: user._id
        });
        
        setGuardState({
          isVerifying: false,
          isAuthorized: false,
          shouldRedirect: false,
          error: reason
        });
        
        if (onUnauthorizedAccess) {
          onUnauthorizedAccess(currentPath, reason);
        }
        return;
      }

      // Check permission requirements
      if (routeConfig.requiredPermission) {
        let hasRequiredPermission = false;
        
        // Use re-verification for admin routes if configured
        if (routeConfig.reVerifyForAdmin && 
            (routeConfig.requiredPermission.includes('admin') || 
             routeConfig.requiredPermission.includes('manage'))) {
          
          logAuthEvent('ROUTE_GUARD_REVERIFYING_PERMISSION', {
            path: currentPath,
            permission: routeConfig.requiredPermission,
            userId: user._id
          });
          
          hasRequiredPermission = await reVerifyPermissions(routeConfig.requiredPermission);
        } else {
          hasRequiredPermission = hasPermission(routeConfig.requiredPermission);
        }

        if (!hasRequiredPermission) {
          const reason = `Permission "${routeConfig.requiredPermission}" required`;
          logAuthEvent('ROUTE_GUARD_PERMISSION_DENIED', {
            path: currentPath,
            requiredPermission: routeConfig.requiredPermission,
            userPermissions: userRole?.permissions || [],
            userId: user._id
          });
          
          setGuardState({
            isVerifying: false,
            isAuthorized: false,
            shouldRedirect: false,
            error: reason
          });
          
          if (onUnauthorizedAccess) {
            onUnauthorizedAccess(currentPath, reason);
          }
          return;
        }
      }

      // All checks passed
      logAuthEvent('ROUTE_GUARD_ACCESS_GRANTED', {
        path: currentPath,
        userId: user._id,
        role: userRole?.role,
        permissions: userRole?.permissions || []
      });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: true,
        shouldRedirect: false
      });

    } catch (error: any) {
      logAuthEvent('ROUTE_GUARD_VERIFICATION_ERROR', {
        path: currentPath,
        userId: user?._id
      }, error);
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: false,
        error: error.message || 'Route verification failed'
      });
      
      if (onUnauthorizedAccess) {
        onUnauthorizedAccess(currentPath, error.message);
      }
    }
  }, [
    location.pathname,
    user,
    isAuthenticated,
    userRole,
    hasPermission,
    reVerifyPermissions,
    findRouteConfig,
    defaultRedirect,
    onUnauthorizedAccess
  ]);

  // Verify route access when location or auth state changes
  useEffect(() => {
    if (!isLoading && !hasTimedOut) {
      verifyRouteAccess();
    }
  }, [isLoading, hasTimedOut, verifyRouteAccess]);

  // Handle authentication timeout
  useEffect(() => {
    if (hasTimedOut) {
      logAuthEvent('ROUTE_GUARD_TIMEOUT_DETECTED', { path: location.pathname });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: true,
        redirectPath: defaultRedirect,
        error: 'Authentication timed out'
      });
    }
  }, [hasTimedOut, defaultRedirect, location.pathname]);

  // Handle authentication errors
  useEffect(() => {
    if (authError && !isLoading) {
      logAuthEvent('ROUTE_GUARD_AUTH_ERROR_DETECTED', { 
        path: location.pathname,
        error: authError.message 
      });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: true,
        redirectPath: defaultRedirect,
        error: authError.message
      });
    }
  }, [authError, isLoading, defaultRedirect, location.pathname]);

  // Handle redirects
  useEffect(() => {
    if (guardState.shouldRedirect && guardState.redirectPath) {
      // Store the current location for redirect after login
      const returnTo = location.pathname + location.search;
      
      logAuthEvent('ROUTE_GUARD_REDIRECTING_UNAUTHORIZED', {
        from: returnTo,
        to: guardState.redirectPath,
        reason: guardState.error
      });
      
      navigate(guardState.redirectPath, { 
        state: { 
          from: returnTo,
          reason: guardState.error || 'Authentication required',
          timestamp: new Date().toISOString(),
          attemptedRoute: location.pathname
        },
        replace: true 
      });
    }
  }, [guardState.shouldRedirect, guardState.redirectPath, location, navigate]);

  // Show loading state during verification
  if (isLoading || guardState.isVerifying) {
    return <PageLoader />;
  }

  // Show loading during redirect
  if (guardState.shouldRedirect) {
    return <PageLoader />;
  }

  // Render children if authorized or if no specific authorization is required
  return <>{children}</>;
};

export default RouteGuard;