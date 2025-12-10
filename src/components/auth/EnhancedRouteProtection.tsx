import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/loading-spinner';
import AccessDenied from './AccessDenied';
import { logAuthEvent } from '@/utils/comprehensiveLogging';
import { getRouteConfig, type RouteProtectionConfig } from '@/config/routeConfig';

interface EnhancedRouteProtectionProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
  showAccessDenied?: boolean;
  onAuthRequired?: (path: string, reason: string) => void;
  onAccessDenied?: (path: string, reason: string) => void;
  onRedirect?: (from: string, to: string, reason: string) => void;
}

interface ProtectionState {
  isVerifying: boolean;
  isAuthorized: boolean;
  shouldRedirect: boolean;
  redirectPath?: string;
  error?: string;
  loadingMessage?: string;
}

export const EnhancedRouteProtection: React.FC<EnhancedRouteProtectionProps> = ({
  children,
  fallbackComponent,
  showAccessDenied = true,
  onAuthRequired,
  onAccessDenied,
  onRedirect
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
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [protectionState, setProtectionState] = useState<ProtectionState>({
    isVerifying: true,
    isAuthorized: false,
    shouldRedirect: false,
    loadingMessage: 'Verifying route access...'
  });

  const performRouteVerification = useCallback(async () => {
    const currentPath = location.pathname;
    
    logAuthEvent('ENHANCED_ROUTE_PROTECTION_START', {
      path: currentPath,
      userId: user?._id,
      isAuthenticated,
      isLoading
    });

    setProtectionState(prev => ({ 
      ...prev, 
      isVerifying: true,
      loadingMessage: 'Checking route permissions...'
    }));

    try {
      // Get route configuration
      const routeConfig = getRouteConfig(currentPath);
      
      logAuthEvent('ROUTE_CONFIG_RETRIEVED', {
        path: currentPath,
        config: routeConfig
      });

      // If no route config found, allow access (public route)
      if (!routeConfig) {
        logAuthEvent('PUBLIC_ROUTE_ACCESS_GRANTED', { path: currentPath });
        setProtectionState({
          isVerifying: false,
          isAuthorized: true,
          shouldRedirect: false
        });
        return;
      }

      // If route doesn't require auth, allow access
      if (!routeConfig.requireAuth) {
        logAuthEvent('NO_AUTH_REQUIRED_ACCESS_GRANTED', { 
          path: currentPath,
          routeConfig 
        });
        setProtectionState({
          isVerifying: false,
          isAuthorized: true,
          shouldRedirect: false
        });
        return;
      }

      // Check authentication
      if (!isAuthenticated || !user) {
        const reason = 'Authentication required';
        const redirectPath = routeConfig.redirectTo || '/auth/login';
        
        logAuthEvent('AUTHENTICATION_REQUIRED', { 
          path: currentPath,
          reason,
          redirectTo: redirectPath
        });
        
        setProtectionState({
          isVerifying: false,
          isAuthorized: false,
          shouldRedirect: true,
          redirectPath,
          error: reason
        });
        
        if (onAuthRequired) {
          onAuthRequired(currentPath, reason);
        }
        return;
      }

      // Update loading message for role verification
      setProtectionState(prev => ({ 
        ...prev, 
        loadingMessage: 'Verifying user permissions...'
      }));

      // Check role requirements
      if (routeConfig.requiredRole && userRole?.role !== routeConfig.requiredRole) {
        const reason = `Role "${routeConfig.requiredRole}" required. Current role: "${userRole?.role || 'none'}"`;
        
        logAuthEvent('ROLE_ACCESS_DENIED', {
          path: currentPath,
          requiredRole: routeConfig.requiredRole,
          userRole: userRole?.role,
          userId: user._id
        });
        
        setProtectionState({
          isVerifying: false,
          isAuthorized: false,
          shouldRedirect: false,
          error: reason
        });
        
        if (onAccessDenied) {
          onAccessDenied(currentPath, reason);
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
          
          setProtectionState(prev => ({ 
            ...prev, 
            loadingMessage: 'Re-verifying admin permissions...'
          }));
          
          logAuthEvent('REVERIFYING_ADMIN_PERMISSION', {
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
          
          logAuthEvent('PERMISSION_ACCESS_DENIED', {
            path: currentPath,
            requiredPermission: routeConfig.requiredPermission,
            userPermissions: userRole?.permissions || [],
            userId: user._id
          });
          
          setProtectionState({
            isVerifying: false,
            isAuthorized: false,
            shouldRedirect: false,
            error: reason
          });
          
          if (onAccessDenied) {
            onAccessDenied(currentPath, reason);
          }
          return;
        }
      }

      // All checks passed
      logAuthEvent('ROUTE_ACCESS_GRANTED', {
        path: currentPath,
        userId: user._id,
        role: userRole?.role,
        permissions: userRole?.permissions || [],
        routeConfig
      });
      
      setProtectionState({
        isVerifying: false,
        isAuthorized: true,
        shouldRedirect: false
      });

    } catch (error: any) {
      logAuthEvent('ROUTE_VERIFICATION_ERROR', {
        path: currentPath,
        userId: user?._id
      }, error);
      
      setProtectionState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: false,
        error: error.message || 'Route verification failed'
      });
      
      if (onAccessDenied) {
        onAccessDenied(currentPath, error.message);
      }
    }
  }, [
    location.pathname,
    user,
    isAuthenticated,
    userRole,
    hasPermission,
    reVerifyPermissions,
    onAuthRequired,
    onAccessDenied
  ]);

  // Verify route access when location or auth state changes
  useEffect(() => {
    if (!isLoading && !hasTimedOut) {
      performRouteVerification();
    }
  }, [isLoading, hasTimedOut, performRouteVerification]);

  // Handle authentication timeout
  useEffect(() => {
    if (hasTimedOut) {
      logAuthEvent('ROUTE_PROTECTION_TIMEOUT_DETECTED', { path: location.pathname });
      
      setProtectionState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: true,
        redirectPath: '/auth/login',
        error: 'Authentication timed out'
      });
    }
  }, [hasTimedOut, location.pathname]);

  // Handle authentication errors
  useEffect(() => {
    if (authError && !isLoading) {
      logAuthEvent('ROUTE_PROTECTION_AUTH_ERROR_DETECTED', { 
        path: location.pathname,
        error: authError.message 
      });
      
      setProtectionState({
        isVerifying: false,
        isAuthorized: false,
        shouldRedirect: true,
        redirectPath: '/auth/login',
        error: authError.message
      });
    }
  }, [authError, isLoading, location.pathname]);

  // Handle redirects
  useEffect(() => {
    if (protectionState.shouldRedirect && protectionState.redirectPath) {
      const returnTo = location.pathname + location.search;
      
      logAuthEvent('ENHANCED_ROUTE_PROTECTION_REDIRECTING', {
        from: returnTo,
        to: protectionState.redirectPath,
        reason: protectionState.error
      });
      
      if (onRedirect) {
        onRedirect(returnTo, protectionState.redirectPath, protectionState.error || 'Access denied');
      }
      
      navigate(protectionState.redirectPath, { 
        state: { 
          from: returnTo,
          reason: protectionState.error || 'Authentication required',
          timestamp: new Date().toISOString(),
          attemptedRoute: location.pathname
        },
        replace: true 
      });
    }
  }, [protectionState.shouldRedirect, protectionState.redirectPath, location, navigate, onRedirect]);

  // Show loading state during verification
  if (isLoading || protectionState.isVerifying) {
    return (
      <PageLoader 
        message={protectionState.loadingMessage || 'Loading...'}
      />
    );
  }

  // Show loading during redirect
  if (protectionState.shouldRedirect) {
    return <PageLoader message="Redirecting..." />;
  }

  // Handle access denied
  if (!protectionState.isAuthorized) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    if (showAccessDenied) {
      const routeConfig = getRouteConfig(location.pathname);
      return (
        <AccessDenied
          requiredPermission={routeConfig?.requiredPermission}
          requiredRole={routeConfig?.requiredRole}
          message={protectionState.error}
          onRetry={performRouteVerification}
        />
      );
    }

    return null;
  }

  // Render children if authorized
  return <>{children}</>;
};

export default EnhancedRouteProtection;