import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { verifyUserRole, updateUserRoleDynamic, type RoleVerificationResult } from '@/utils/roleManagement';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleContextType {
  roleData: RoleVerificationResult | null;
  isLoadingRole: boolean;
  refreshRole: () => Promise<void>;
  updateRole: (userId: string, newRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: AppRole | 'user') => boolean;
}

const RoleContext = createContext<RoleContextType>({
  roleData: null,
  isLoadingRole: true,
  refreshRole: async () => {},
  updateRole: async () => ({ success: false }),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasRole: () => false,
});

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [roleData, setRoleData] = useState<RoleVerificationResult | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Logging utility for role provider events
  const logRoleProviderEvent = (event: string, data?: any) => {
    console.log(`[ROLE_PROVIDER] ${event}:`, {
      timestamp: new Date().toISOString(),
      userId: user?._id,
      ...data
    });
  };

  const refreshRole = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setRoleData(null);
      setIsLoadingRole(false);
      return;
    }

    logRoleProviderEvent('ROLE_REFRESH_START');
    setIsLoadingRole(true);

    try {
      const result = await verifyUserRole(user._id);
      setRoleData(result);
      
      logRoleProviderEvent('ROLE_REFRESH_SUCCESS', {
        role: result.role,
        permissions: result.permissions.length,
        fallbackApplied: result.fallbackApplied
      });
    } catch (error: any) {
      logRoleProviderEvent('ROLE_REFRESH_ERROR', { error: error.message });
      
      // Set fallback role data
      setRoleData({
        isVerified: false,
        role: 'user',
        permissions: ['read_profile', 'update_own_profile'],
        lastVerified: new Date(),
        fallbackApplied: true,
        error: error.message
      });
    } finally {
      setIsLoadingRole(false);
    }
  }, [user, isAuthenticated]);

  const updateRole = useCallback(async (userId: string, newRole: AppRole) => {
    logRoleProviderEvent('ROLE_UPDATE_START', { targetUserId: userId, newRole });

    try {
      const result = await updateUserRoleDynamic(userId, newRole, (updatedRole, permissions) => {
        // If updating current user's role, refresh local role data
        if (userId === user?._id) {
          setRoleData(prev => prev ? {
            ...prev,
            role: updatedRole,
            permissions,
            lastVerified: new Date(),
            fallbackApplied: false
          } : null);
          
          logRoleProviderEvent('CURRENT_USER_ROLE_UPDATED', { 
            newRole: updatedRole, 
            permissions: permissions.length 
          });
        }
      });

      if (result.success) {
        logRoleProviderEvent('ROLE_UPDATE_SUCCESS', { targetUserId: userId, newRole });
      } else {
        logRoleProviderEvent('ROLE_UPDATE_FAILED', { 
          targetUserId: userId, 
          newRole, 
          error: result.error 
        });
      }

      return result;
    } catch (error: any) {
      logRoleProviderEvent('ROLE_UPDATE_ERROR', { 
        targetUserId: userId, 
        newRole, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!roleData) return false;
    return roleData.permissions.includes(permission);
  }, [roleData]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!roleData) return false;
    return permissions.some(permission => roleData.permissions.includes(permission));
  }, [roleData]);

  const hasRole = useCallback((role: AppRole | 'user'): boolean => {
    if (!roleData) return false;
    return roleData.role === role;
  }, [roleData]);

  // Refresh role when user changes
  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  // Listen for role changes from other parts of the app
  useEffect(() => {
    const handleRoleChange = (event: CustomEvent) => {
      logRoleProviderEvent('EXTERNAL_ROLE_CHANGE_EVENT', event.detail);
      refreshRole();
    };

    window.addEventListener('roleChanged', handleRoleChange as EventListener);
    
    return () => {
      window.removeEventListener('roleChanged', handleRoleChange as EventListener);
    };
  }, [refreshRole]);

  const value: RoleContextType = {
    roleData,
    isLoadingRole,
    refreshRole,
    updateRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

// Utility function to dispatch role change events
export const dispatchRoleChangeEvent = (data: any) => {
  const event = new CustomEvent('roleChanged', { detail: data });
  window.dispatchEvent(event);
};

export default RoleProvider;