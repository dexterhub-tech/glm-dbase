import React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import AuthGuard from './AuthGuard';

interface ProtectedRouteProps extends Omit<RouteProps, 'element'> {
  element: React.ReactElement;
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

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  requireAuth = true,
  requiredPermission,
  requiredRole,
  redirectTo = '/auth/login',
  fallbackComponent,
  showAccessDenied = true,
  reVerifyForAdmin = false,
  onAuthRequired,
  onAccessDenied,
  ...routeProps
}) => {
  return (
    <Route
      {...(routeProps as any)}
      element={
        <AuthGuard
          requireAuth={requireAuth}
          requiredPermission={requiredPermission}
          requiredRole={requiredRole}
          redirectTo={redirectTo}
          fallbackComponent={fallbackComponent}
          showAccessDenied={showAccessDenied}
          reVerifyForAdmin={reVerifyForAdmin}
          onAuthRequired={onAuthRequired}
          onAccessDenied={onAccessDenied}
        >
          {element}
        </AuthGuard>
      }
    />
  );
};

export default ProtectedRoute;