import React, { ComponentType } from 'react';
import PermissionGuard from './PermissionGuard';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleProtectionOptions {
  requiredPermission?: string;
  requiredRole?: AppRole | 'user';
  fallbackComponent?: React.ComponentType;
  showAccessDenied?: boolean;
  reVerifyForAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Higher-order component that wraps a component with role-based protection
 */
export function withRoleProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: RoleProtectionOptions
) {
  const {
    requiredPermission = 'read_profile',
    requiredRole,
    fallbackComponent: FallbackComponent,
    showAccessDenied = true,
    reVerifyForAdmin = false,
    redirectTo
  } = options;

  const ProtectedComponent: React.FC<P> = (props) => {
    // If redirect is specified, handle it in the permission guard
    const handlePermissionDenied = () => {
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    };

    return (
      <PermissionGuard
        requiredPermission={requiredPermission}
        requiredRole={requiredRole}
        fallbackComponent={FallbackComponent ? <FallbackComponent /> : undefined}
        showAccessDenied={showAccessDenied}
        reVerifyForAdmin={reVerifyForAdmin}
        onPermissionDenied={redirectTo ? handlePermissionDenied : undefined}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ProtectedComponent;
}

// Convenience HOCs for common protection scenarios
export const withAdminProtection = <P extends object>(
  WrappedComponent: ComponentType<P>,
  options: Omit<RoleProtectionOptions, 'requiredPermission'> = {}
) => withRoleProtection(WrappedComponent, {
  requiredPermission: 'view_admin_dashboard',
  reVerifyForAdmin: true,
  ...options
});

export const withSuperAdminProtection = <P extends object>(
  WrappedComponent: ComponentType<P>,
  options: Omit<RoleProtectionOptions, 'requiredPermission'> = {}
) => withRoleProtection(WrappedComponent, {
  requiredPermission: 'system_admin',
  reVerifyForAdmin: true,
  ...options
});

export const withMemberManagementProtection = <P extends object>(
  WrappedComponent: ComponentType<P>,
  options: Omit<RoleProtectionOptions, 'requiredPermission'> = {}
) => withRoleProtection(WrappedComponent, {
  requiredPermission: 'manage_members',
  reVerifyForAdmin: true,
  ...options
});

export default withRoleProtection;