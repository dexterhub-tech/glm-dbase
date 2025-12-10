import React, { useEffect, useState, useCallback } from 'react';
import { checkPermission, reVerifyAdminPermissions, type PermissionCheckResult } from '@/utils/roleManagement';
import { useAuth } from '@/contexts/AuthContext';
import AccessDenied from './AccessDenied';
import { PageLoader } from '@/components/ui/loading-spinner';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  requiredRole?: string;
  fallbackComponent?: React.ReactNode;
  showAccessDenied?: boolean;
  reVerifyForAdmin?: boolean;
  onPermissionDenied?: (result: PermissionCheckResult) => void;
  onPermissionGranted?: (result: PermissionCheckResult) => void;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackComponent,
  showAccessDenied = true,
  reVerifyForAdmin = false,
  onPermissionDenied,
  onPermissionGranted
}) => {
  const { user, isLoading } = useAuth();
  const [permissionState, setPermissionState] = useState<{
    isChecking: boolean;
    hasPermission: boolean;
    result?: PermissionCheckResult;
    error?: string;
  }>({
    isChecking: true,
    hasPermission: false
  });

  const checkUserPermission = useCallback(async () => {
    if (!user) {
      setPermissionState({
        isChecking: false,
        hasPermission: false,
        error: 'No authenticated user'
      });
      return;
    }

    try {
      setPermissionState(prev => ({ ...prev, isChecking: true }));

      let result: PermissionCheckResult;

      // Use re-verification for admin features if requested
      if (reVerifyForAdmin && (requiredPermission.includes('admin') || requiredPermission.includes('manage'))) {
        result = await reVerifyAdminPermissions(requiredPermission);
      } else {
        result = await checkPermission(requiredPermission);
      }

      setPermissionState({
        isChecking: false,
        hasPermission: result.hasPermission,
        result
      });

      // Call appropriate callback
      if (result.hasPermission && onPermissionGranted) {
        onPermissionGranted(result);
      } else if (!result.hasPermission && onPermissionDenied) {
        onPermissionDenied(result);
      }

    } catch (error: any) {
      setPermissionState({
        isChecking: false,
        hasPermission: false,
        error: error.message
      });

      if (onPermissionDenied) {
        onPermissionDenied({
          hasPermission: false,
          fallbackApplied: true,
          error: error.message
        });
      }
    }
  }, [user, requiredPermission, reVerifyForAdmin, onPermissionGranted, onPermissionDenied]);

  // Check permissions when user or permission requirements change
  useEffect(() => {
    if (!isLoading) {
      checkUserPermission();
    }
  }, [isLoading, checkUserPermission]);

  // Show loading state
  if (isLoading || permissionState.isChecking) {
    return <PageLoader />;
  }

  // Show access denied if no permission
  if (!permissionState.hasPermission) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    if (showAccessDenied) {
      return (
        <AccessDenied
          requiredPermission={requiredPermission}
          requiredRole={requiredRole}
          message={permissionState.error}
          onRetry={checkUserPermission}
        />
      );
    }

    return null;
  }

  // Render children if permission is granted
  return <>{children}</>;
};

export default PermissionGuard;