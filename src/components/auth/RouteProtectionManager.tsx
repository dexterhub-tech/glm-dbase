import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getRouteConfig, type RouteProtectionConfig } from '@/config/routeConfig';
import { logAuthEvent } from '@/utils/comprehensiveLogging';

interface RouteProtectionState {
  currentRoute: string;
  isProtected: boolean;
  isAuthorized: boolean;
  isVerifying: boolean;
  error?: string;
  redirectPath?: string;
  routeConfig?: RouteProtectionConfig;
}

interface RouteProtectionContextType {
  protectionState: RouteProtectionState;
  checkRouteAccess: (path?: string) => Promise<boolean>;
  handleUnauthorizedAccess: (reason: string, redirectPath?: string) => void;
  clearProtectionError: () => void;
  getProtectionStatus: (path: string) => RouteProtectionState;
}

const RouteProtectionContext = createContext<RouteProtectionContextType | null>(null);

export const useRouteProtection = () => {
  const context = useContext(RouteProtectionContext);
  if (!context) {
    throw new Error('useRouteProtection must be used within a RouteProtectionProvider');
  }
  return context;
};

interface RouteProtectionProviderProps {
  children: React.ReactNode;
  onUnauthorizedAccess?: (path: string, reason: string) => void;
  onAccessGranted?: (path: string, config: RouteProtectionConfig) => void;
  defaultRedirectPath?: string;
}

export const RouteProtectionProvider: React.FC<RouteProtectionProviderProps> = ({
  children,
  onUnauthorizedAccess,
  onAccessGranted,
  defaultRedirectPath = '/auth/login'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    hasPermission, 
    reVerifyPermissions,
    userRole 
  } = useAuth();

  const [protectionState, setProtectionState] = useState<RouteProtectionState>({
    currentRoute: location.pathname,
    isProtected: false,
    isAuthorized: false,
    isVerifying: true
  });

  const checkRouteAccess = useCallback(async (path?: string): Promise<boolean> => {
    const targetPath = path || location.pathname;
    const routeConfig = getRouteConfig(targetPath);

    logAuthEvent('ROUTE_PROTECTION_MANAGER_CHECK_START', {
      path: targetPath,
      userId: user?._id,
      routeConfig
    });

    setProtectionState(prev => ({
      ...prev,
      currentRoute: targetPath,
      isVerifying: true,
      error: undefined,
      routeConfig
    }));

    try {
      // Public route - no protection needed
      if (!routeConfig || !routeConfig.requireAuth) {
        setProtectionState(prev => ({
          ...prev,
          isProtected: false,
          isAuthorized: true,
          isVerifying: false
        }));
        
        logAuthEvent('ROUTE_ACCESS_PUBLIC', { path: targetPath });
        return true;
      }

      // Protected route - check authentication
      setProtectionState(prev => ({
        ...prev,
        isProtected: true
      }));

      if (!isAuthenticated || !user) {
        const reason = 'Authentication required';
        setProtectionState(prev => ({
          ...prev,
          isAuthorized: false,
          isVerifying: false,
          error: reason,
          redirectPath: routeConfig.redirectTo || defaultRedirectPath
        }));
        
        logAuthEvent('ROUTE_ACCESS_DENIED_AUTH', { 
          path: targetPath, 
          reason 
        });
        
        if (onUnauthorizedAccess) {
          onUnauthorizedAccess(targetPath, reason);
        }
        
        return false;
      }

      // Check role requirements
      if (routeConfig.requiredRole && userRole?.role !== routeConfig.requiredRole) {
        const reason = `Role "${routeConfig.requiredRole}" required`;
        setProtectionState(prev => ({
          ...prev,
          isAuthorized: false,
          isVerifying: false,
          error: reason
        }));
        
        logAuthEvent('ROUTE_ACCESS_DENIED_ROLE', {
          path: targetPath,
          requiredRole: routeConfig.requiredRole,
          userRole: userRole?.role,
          userId: user._id
        });
        
        if (onUnauthorizedAccess) {
          onUnauthorizedAccess(targetPath, reason);
        }
        
        return false;
      }

      // Check permission requirements
      if (routeConfig.requiredPermission) {
        let hasRequiredPermission = false;
        
        // Use re-verification for admin routes if configured
        if (routeConfig.reVerifyForAdmin && 
            (routeConfig.requiredPermission.includes('admin') || 
             routeConfig.requiredPermission.includes('manage'))) {
          
          logAuthEvent('ROUTE_REVERIFYING_ADMIN_PERMISSION', {
            path: targetPath,
            permission: routeConfig.requiredPermission,
            userId: user._id
          });
          
          hasRequiredPermission = await reVerifyPermissions(routeConfig.requiredPermission);
        } else {
          hasRequiredPermission = hasPermission(routeConfig.requiredPermission);
        }

        if (!hasRequiredPermission) {
          const reason = `Permission "${routeConfig.requiredPermission}" required`;
          setProtectionState(prev => ({
            ...prev,
            isAuthorized: false,
            isVerifying: false,
            error: reason
          }));
          
          logAuthEvent('ROUTE_ACCESS_DENIED_PERMISSION', {
            path: targetPath,
            requiredPermission: routeConfig.requiredPermission,
            userPermissions: userRole?.permissions || [],
            userId: user._id
          });
          
          if (onUnauthorizedAccess) {
            onUnauthorizedAccess(targetPath, reason);
          }
          
          return false;
        }
      }

      // All checks passed
      setProtectionState(prev => ({
        ...prev,
        isAuthorized: true,
        isVerifying: false,
        error: undefined
      }));
      
      logAuthEvent('ROUTE_ACCESS_GRANTED_MANAGER', {
        path: targetPath,
        userId: user._id,
        role: userRole?.role,
        permissions: userRole?.permissions || []
      });
      
      if (onAccessGranted && routeConfig) {
        onAccessGranted(targetPath, routeConfig);
      }
      
      return true;

    } catch (error: any) {
      logAuthEvent('ROUTE_PROTECTION_MANAGER_ERROR', {
        path: targetPath,
        userId: user?._id
      }, error);
      
      setProtectionState(prev => ({
        ...prev,
        isAuthorized: false,
        isVerifying: false,
        error: error.message || 'Route verification failed'
      }));
      
      if (onUnauthorizedAccess) {
        onUnauthorizedAccess(targetPath, error.message);
      }
      
      return false;
    }
  }, [
    location.pathname,
    user,
    isAuthenticated,
    userRole,
    hasPermission,
    reVerifyPermissions,
    defaultRedirectPath,
    onUnauthorizedAccess,
    onAccessGranted
  ]);

  const handleUnauthorizedAccess = useCallback((reason: string, redirectPath?: string) => {
    const targetRedirect = redirectPath || protectionState.redirectPath || defaultRedirectPath;
    const currentPath = location.pathname + location.search;
    
    logAuthEvent('ROUTE_PROTECTION_MANAGER_HANDLING_UNAUTHORIZED', {
      from: currentPath,
      to: targetRedirect,
      reason
    });
    
    navigate(targetRedirect, {
      state: {
        from: currentPath,
        reason,
        timestamp: new Date().toISOString(),
        managedRedirect: true
      },
      replace: true
    });
  }, [protectionState.redirectPath, defaultRedirectPath, location, navigate]);

  const clearProtectionError = useCallback(() => {
    setProtectionState(prev => ({
      ...prev,
      error: undefined
    }));
  }, []);

  const getProtectionStatus = useCallback((path: string): RouteProtectionState => {
    const routeConfig = getRouteConfig(path);
    
    return {
      currentRoute: path,
      isProtected: !!routeConfig?.requireAuth,
      isAuthorized: false, // This would need to be checked
      isVerifying: false,
      routeConfig
    };
  }, []);

  // Check route access when location or auth state changes
  useEffect(() => {
    if (!isLoading) {
      checkRouteAccess();
    }
  }, [location.pathname, isLoading, checkRouteAccess]);

  const contextValue: RouteProtectionContextType = {
    protectionState,
    checkRouteAccess,
    handleUnauthorizedAccess,
    clearProtectionError,
    getProtectionStatus
  };

  return (
    <RouteProtectionContext.Provider value={contextValue}>
      {children}
    </RouteProtectionContext.Provider>
  );
};

export default RouteProtectionProvider;