// Authentication Guard Components
export { default as AuthGuard } from './AuthGuard';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as RouteGuard } from './RouteGuard';
export { default as PermissionGuard } from './PermissionGuard';
export { default as AccessDenied } from './AccessDenied';

// Enhanced Route Protection Components
export { default as EnhancedRouteProtection } from './EnhancedRouteProtection';
export { default as RouteProtectionProvider, useRouteProtection } from './RouteProtectionManager';

// Higher-Order Components
export { default as withRouteProtection, useRouteProtectionStatus } from './withRouteProtection';
export { default as withRoleProtection } from './withRoleProtection';

// Route configuration
export { 
  routeProtectionConfig,
  getRouteConfig,
  routeRequiresAuth,
  getRequiredPermission,
  getRequiredRole,
  routeRequiresReVerification,
  getRedirectPath
} from '../../config/routeConfig';

// Error Recovery Components
export { default as ErrorRecoveryPanel } from './ErrorRecoveryPanel';
export { default as ErrorBoundaryWithRecovery } from './ErrorBoundaryWithRecovery';