import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

// Enhanced role management with fallback mechanisms and dynamic updates
export interface RoleVerificationResult {
  isVerified: boolean;
  role: AppRole | 'user';
  permissions: string[];
  lastVerified: Date;
  fallbackApplied: boolean;
  error?: string;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  fallbackApplied: boolean;
  error?: string;
}

// Default permissions for fallback scenarios
const DEFAULT_PERMISSIONS = {
  user: ['read_profile', 'update_own_profile'],
  admin: ['read_profile', 'update_own_profile', 'manage_members', 'manage_events', 'view_admin_dashboard', 'manage_admins'],
  superuser: ['read_profile', 'update_own_profile', 'manage_members', 'manage_events', 'view_admin_dashboard', 'manage_admins', 'system_admin']
};

// Permission hierarchy for fallback
const PERMISSION_HIERARCHY: Record<string, string[]> = {
  'system_admin': ['manage_admins', 'view_admin_dashboard', 'manage_events', 'manage_members', 'update_own_profile', 'read_profile'],
  'manage_admins': ['view_admin_dashboard', 'manage_events', 'manage_members', 'update_own_profile', 'read_profile'],
  'view_admin_dashboard': ['manage_events', 'manage_members', 'update_own_profile', 'read_profile'],
  'manage_events': ['update_own_profile', 'read_profile'],
  'manage_members': ['update_own_profile', 'read_profile'],
  'update_own_profile': ['read_profile'],
  'read_profile': []
};

// Logging utility for role management events
const logRoleEvent = (event: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    event,
    data,
    error: error ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
    } : undefined,
  };
  
  console.log(`[ROLE_MANAGEMENT] ${event}:`, logData);
};

/**
 * Add a user role by directly inserting into the user_roles table
 * This requires appropriate permissions
 */
export const addUserRoleSafe = async (
  userId: string,
  role: AppRole
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Insert the role directly into the user_roles table
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: role,
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error adding user role:", error);
    return { success: false, error };
  }
};

/**
 * Enhanced role verification with fallback mechanisms
 */
export const verifyUserRole = async (userId?: string): Promise<RoleVerificationResult> => {
  const startTime = Date.now();
  logRoleEvent('ROLE_VERIFICATION_START', { userId });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      logRoleEvent('ROLE_VERIFICATION_NO_USER');
      return {
        isVerified: false,
        role: 'user',
        permissions: DEFAULT_PERMISSIONS.user,
        lastVerified: new Date(),
        fallbackApplied: true,
        error: 'No user ID available'
      };
    }

    // Try to get role from database
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logRoleEvent('ROLE_VERIFICATION_DB_ERROR', { userId: targetUserId }, error);
      
      // Fallback to default user role
      return {
        isVerified: false,
        role: 'user',
        permissions: DEFAULT_PERMISSIONS.user,
        lastVerified: new Date(),
        fallbackApplied: true,
        error: `Database error: ${error.message}`
      };
    }

    const role = roleData?.role || 'user';
    const permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.user;
    
    const result: RoleVerificationResult = {
      isVerified: true,
      role: role as AppRole | 'user',
      permissions,
      lastVerified: new Date(),
      fallbackApplied: !roleData, // True if we fell back to default user role
    };

    const duration = Date.now() - startTime;
    logRoleEvent('ROLE_VERIFICATION_SUCCESS', { 
      userId: targetUserId, 
      role, 
      permissions: permissions.length,
      duration,
      fallbackApplied: result.fallbackApplied
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logRoleEvent('ROLE_VERIFICATION_ERROR', { userId, duration }, error);
    
    // Return fallback result
    return {
      isVerified: false,
      role: 'user',
      permissions: DEFAULT_PERMISSIONS.user,
      lastVerified: new Date(),
      fallbackApplied: true,
      error: error.message
    };
  }
};

/**
 * Check if the current user is a superuser with fallback
 */
export const checkIsSuperUser = async (): Promise<boolean> => {
  try {
    const verification = await verifyUserRole();
    return verification.role === 'admin' && verification.permissions.includes('system_admin');
  } catch (error) {
    logRoleEvent('SUPERUSER_CHECK_ERROR', {}, error);
    return false;
  }
};

/**
 * Check if the current user is an admin with fallback
 */
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const verification = await verifyUserRole();
    return verification.role === 'admin' || verification.permissions.includes('view_admin_dashboard');
  } catch (error) {
    logRoleEvent('ADMIN_CHECK_ERROR', {}, error);
    return false;
  }
};

/**
 * Check if user has specific permission with fallback
 */
export const checkPermission = async (permission: string, userId?: string): Promise<PermissionCheckResult> => {
  logRoleEvent('PERMISSION_CHECK_START', { permission, userId });

  try {
    const verification = await verifyUserRole(userId);
    
    // Check direct permission
    const hasDirectPermission = verification.permissions.includes(permission);
    
    if (hasDirectPermission) {
      logRoleEvent('PERMISSION_CHECK_SUCCESS', { permission, userId, direct: true });
      return {
        hasPermission: true,
        fallbackApplied: verification.fallbackApplied
      };
    }

    // Check hierarchical permissions (if user has higher permission, they have lower ones)
    const userPermissions = verification.permissions;
    const hasHierarchicalPermission = userPermissions.some(userPerm => 
      PERMISSION_HIERARCHY[userPerm]?.includes(permission)
    );

    if (hasHierarchicalPermission) {
      logRoleEvent('PERMISSION_CHECK_SUCCESS', { permission, userId, hierarchical: true });
      return {
        hasPermission: true,
        fallbackApplied: verification.fallbackApplied
      };
    }

    logRoleEvent('PERMISSION_CHECK_DENIED', { permission, userId, userPermissions });
    return {
      hasPermission: false,
      fallbackApplied: verification.fallbackApplied
    };

  } catch (error: any) {
    logRoleEvent('PERMISSION_CHECK_ERROR', { permission, userId }, error);
    return {
      hasPermission: false,
      fallbackApplied: true,
      error: error.message
    };
  }
};

/**
 * Re-verify permissions for admin features (fresh check)
 */
export const reVerifyAdminPermissions = async (requiredPermission: string = 'view_admin_dashboard'): Promise<PermissionCheckResult> => {
  logRoleEvent('ADMIN_PERMISSION_REVERIFY_START', { requiredPermission });

  try {
    // Force fresh verification by not using cached data
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logRoleEvent('ADMIN_PERMISSION_REVERIFY_NO_USER');
      return {
        hasPermission: false,
        fallbackApplied: true,
        error: 'No authenticated user'
      };
    }

    // Fresh database check
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logRoleEvent('ADMIN_PERMISSION_REVERIFY_DB_ERROR', { requiredPermission }, error);
      return {
        hasPermission: false,
        fallbackApplied: true,
        error: `Database error: ${error.message}`
      };
    }

    const role = roleData?.role || 'user';
    const permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.user;
    
    const hasPermission = permissions.includes(requiredPermission) || 
      permissions.some(perm => PERMISSION_HIERARCHY[perm]?.includes(requiredPermission));

    logRoleEvent('ADMIN_PERMISSION_REVERIFY_RESULT', { 
      requiredPermission, 
      role, 
      hasPermission,
      fallbackApplied: !roleData
    });

    return {
      hasPermission,
      fallbackApplied: !roleData
    };

  } catch (error: any) {
    logRoleEvent('ADMIN_PERMISSION_REVERIFY_ERROR', { requiredPermission }, error);
    return {
      hasPermission: false,
      fallbackApplied: true,
      error: error.message
    };
  }
};

/**
 * Remove a user role by deleting from the user_roles table
 * This requires appropriate permissions
 */
export const removeUserRoleSafe = async (
  userId: string,
  role: AppRole
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Delete the role from the user_roles table
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error removing user role:", error);
    return { success: false, error };
  }
};

/**
 * Check if a user has a specific role
 */
export const userHasRole = async (userId: string, role: AppRole): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", role)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking user role:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
};

/**
 * Get all user roles for a specific user with enhanced access control
 */
export const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Check if current user is admin or if they're querying their own roles
    const isCurrentUser = user?.id === userId;
    const adminCheck = await checkPermission('manage_members');

    if (adminCheck.hasPermission || isCurrentUser) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      return data?.map(r => r.role) || [];
    }

    logRoleEvent('GET_USER_ROLES_ACCESS_DENIED', { userId, currentUserId: user?.id });
    return [];
  } catch (error) {
    logRoleEvent('GET_USER_ROLES_ERROR', { userId }, error);
    return [];
  }
};

/**
 * Dynamic role update without requiring re-login
 */
export const updateUserRoleDynamic = async (
  userId: string, 
  newRole: AppRole,
  onRoleUpdated?: (newRole: AppRole, permissions: string[]) => void
): Promise<{ success: boolean; error?: string; roleData?: RoleVerificationResult }> => {
  logRoleEvent('DYNAMIC_ROLE_UPDATE_START', { userId, newRole });

  try {
    // Check if current user has permission to update roles
    const permissionCheck = await checkPermission('manage_admins');
    
    if (!permissionCheck.hasPermission) {
      logRoleEvent('DYNAMIC_ROLE_UPDATE_ACCESS_DENIED', { userId, newRole });
      return {
        success: false,
        error: 'Insufficient permissions to update user roles'
      };
    }

    // Update role in database
    const { error: updateError } = await supabase
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: newRole,
      });

    if (updateError) {
      logRoleEvent('DYNAMIC_ROLE_UPDATE_DB_ERROR', { userId, newRole }, updateError);
      return {
        success: false,
        error: `Database error: ${updateError.message}`
      };
    }

    // Get fresh role verification
    const roleData = await verifyUserRole(userId);
    
    // Notify callback if provided
    if (onRoleUpdated) {
      onRoleUpdated(newRole, roleData.permissions);
    }

    logRoleEvent('DYNAMIC_ROLE_UPDATE_SUCCESS', { 
      userId, 
      newRole, 
      permissions: roleData.permissions 
    });

    return {
      success: true,
      roleData
    };

  } catch (error: any) {
    logRoleEvent('DYNAMIC_ROLE_UPDATE_ERROR', { userId, newRole }, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Batch role verification for multiple users (for admin interfaces)
 */
export const batchVerifyRoles = async (userIds: string[]): Promise<Record<string, RoleVerificationResult>> => {
  logRoleEvent('BATCH_ROLE_VERIFY_START', { userCount: userIds.length });

  const results: Record<string, RoleVerificationResult> = {};

  // Check permission to perform batch verification
  const permissionCheck = await checkPermission('manage_members');
  if (!permissionCheck.hasPermission) {
    logRoleEvent('BATCH_ROLE_VERIFY_ACCESS_DENIED');
    // Return default user roles for all users
    userIds.forEach(userId => {
      results[userId] = {
        isVerified: false,
        role: 'user',
        permissions: DEFAULT_PERMISSIONS.user,
        lastVerified: new Date(),
        fallbackApplied: true,
        error: 'Insufficient permissions for batch verification'
      };
    });
    return results;
  }

  // Perform batch verification
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        results[userId] = await verifyUserRole(userId);
      } catch (error: any) {
        results[userId] = {
          isVerified: false,
          role: 'user',
          permissions: DEFAULT_PERMISSIONS.user,
          lastVerified: new Date(),
          fallbackApplied: true,
          error: error.message
        };
      }
    })
  );

  logRoleEvent('BATCH_ROLE_VERIFY_SUCCESS', { 
    userCount: userIds.length,
    successCount: Object.values(results).filter(r => r.isVerified).length
  });

  return results;
};
