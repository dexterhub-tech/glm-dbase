import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/loading-spinner';
import AccessDenied from './AccessDenied';
import { logAuthEvent } from '@/utils/comprehensiveLogging';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
  showAccessDenied?: boolean;
  reVerifyForAdmin?: boolean;
  onAuthRequired?: () => void;
  onAccessDenied?: () => void;
}

interface AuthGuardState {
  isVerifying: boolean;
  isAuthorized: boolean;
  error?: string;
  redirectPath?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  redirectTo = '/auth/login',
  fallbackComponent,
  showAccessDenied = true,
  reVerifyForAdmin = false,
  onAuthRequired,
  onAccessDenied
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
  
  const [guardState, setGuardState] = useState<AuthGuardState>({
    isVerifying: true,
    isAuthorized: false
  });

  const performAuthCheck = useCallback(async () => {
    logAuthEvent('AUTH_GUARD_CHECK_START', {
      path: location.pathname,
      requireAuth,
      requiredPermission,
      requiredRole,
      userId: user?._id
    });

    setGuardState(prev => ({ ...prev, isVerifying: true }));

    try {
      // If authentication is not required, allow access
      if (!requireAuth) {
        setGuardState({
          isVerifying: false,
          isAuthorized: true
        });
        logAuthEvent('AUTH_GUARD_NO_AUTH_REQUIRED', { path: location.pathname });
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        logAuthEvent('AUTH_GUARD_NOT_AUTHENTICATED', { 
          path: location.pathname,
          hasUser: !!user,
          isAuthenticated 
        });
        
        setGuardState({
          isVerifying: false,
          isAuthorized: false,
          error: 'Authentication required',
          redirectPath: redirectTo
        });
        
        if (onAuthRequired) {
          onAuthRequired();
        }
        return;
      }

      // Check role-based access if required
      if (requiredRole && userRole?.role !== requiredRole) {
        logAuthEvent('AUTH_GUARD_ROLE_DENIED', {
          path: location.pathname,
          requiredRole,
          userRole: userRole?.role,
          userId: user._id
        });
        
        setGuardState({
          isVerifying: false,
          isAuthorized: false,
          error: `Role "${requiredRole}" required`
        });
        
        if (onAccessDenied) {
          onAccessDenied();
        }
        return;
      }

      // Check permission-based access if required
      if (requiredPermission) {
        let hasRequiredPermission = false;
        
        // Use re-verification for admin features if requested
        if (reVerifyForAdmin && (requiredPermission.includes('admin') || requiredPermission.includes('manage'))) {
          logAuthEvent('AUTH_GUARD_REVERIFYING_ADMIN_PERMISSION', {
            path: location.pathname,
            permission: requiredPermission,
            userId: user._id
          });
          
          hasRequiredPermission = await reVerifyPermissions(requiredPermission);
        } else {
          hasRequiredPermission = hasPermission(requiredPermission);
        }

        if (!hasRequiredPermission) {
          logAuthEvent('AUTH_GUARD_PERMISSION_DENIED', {
            path: location.pathname,
            requiredPermission,
            userPermissions: userRole?.permissions || [],
            userId: user._id
          });
          
          setGuardState({
            isVerifying: false,
            isAuthorized: false,
            error: `Permission "${requiredPermission}" required`
          });
          
          if (onAccessDenied) {
            onAccessDenied();
          }
          return;
        }
      }

      // All checks passed
      logAuthEvent('AUTH_GUARD_ACCESS_GRANTED', {
        path: location.pathname,
        userId: user._id,
        role: userRole?.role,
        permissions: userRole?.permissions || []
      });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: true
      });

    } catch (error: any) {
      logAuthEvent('AUTH_GUARD_CHECK_ERROR', {
        path: location.pathname,
        userId: user?._id
      }, error);
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        error: error.message || 'Authorization check failed'
      });
      
      if (onAccessDenied) {
        onAccessDenied();
      }
    }
  }, [
    requireAuth,
    requiredPermission,
    requiredRole,
    user,
    isAuthenticated,
    userRole,
    hasPermission,
    reVerifyPermissions,
    reVerifyForAdmin,
    location.pathname,
    redirectTo,
    onAuthRequired,
    onAccessDenied
  ]);

  // Perform auth check when dependencies change
  useEffect(() => {
    if (!isLoading && !hasTimedOut) {
      performAuthCheck();
    }
  }, [isLoading, hasTimedOut, performAuthCheck]);

  // Handle authentication timeout
  useEffect(() => {
    if (hasTimedOut) {
      logAuthEvent('AUTH_GUARD_TIMEOUT_DETECTED', { path: location.pathname });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        error: 'Authentication timed out',
        redirectPath: redirectTo
      });
    }
  }, [hasTimedOut, redirectTo, location.pathname]);

  // Handle authentication errors
  useEffect(() => {
    if (authError && !isLoading) {
      logAuthEvent('AUTH_GUARD_AUTH_ERROR_DETECTED', { 
        path: location.pathname,
        error: authError.message 
      });
      
      setGuardState({
        isVerifying: false,
        isAuthorized: false,
        error: authError.message,
        redirectPath: redirectTo
      });
    }
  }, [authError, isLoading, redirectTo, location.pathname]);

  // Show loading state during verification
  if (isLoading || guardState.isVerifying) {
    return <PageLoader />;
  }

  // Handle redirect for authentication required
  if (guardState.redirectPath && requireAuth && !isAuthenticated) {
    // Store the current location for redirect after login
    const returnTo = location.pathname + location.search;
    
    logAuthEvent('AUTH_GUARD_REDIRECTING_UNAUTHORIZED', {
      from: returnTo,
      to: guardState.redirectPath,
      reason: guardState.error
    });
    
    navigate(guardState.redirectPath, { 
      state: { 
        from: returnTo,
        reason: guardState.error || 'Authentication required',
        timestamp: new Date().toISOString()
      },
      replace: true 
    });
    return <PageLoader />;
  }

  // Handle access denied
  if (!guardState.isAuthorized) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    if (showAccessDenied) {
      return (
        <AccessDenied
          requiredPermission={requiredPermission}
          requiredRole={requiredRole}
          message={guardState.error}
          onRetry={performAuthCheck}
        />
      );
    }

    return null;
  }

  // Render children if authorized
  return <>{children}</>;
};

export default AuthGuard;