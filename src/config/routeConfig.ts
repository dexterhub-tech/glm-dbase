export interface RouteProtectionConfig {
  path: string;
  requireAuth?: boolean;
  requiredPermission?: string;
  requiredRole?: string;
  redirectTo?: string;
  reVerifyForAdmin?: boolean;
  description?: string;
}

/**
 * Route protection configuration for the application
 * This defines which routes require authentication and what permissions are needed
 */
export const routeProtectionConfig: RouteProtectionConfig[] = [
  // Public routes (no authentication required)
  {
    path: '/auth',
    requireAuth: false,
    description: 'Authentication page'
  },
  {
    path: '/auth/login',
    requireAuth: false,
    description: 'Login page'
  },
  {
    path: '/auth/signup',
    requireAuth: false,
    description: 'Signup page'
  },
  {
    path: '/auth/callback',
    requireAuth: false,
    description: 'Authentication callback'
  },
  
  // Protected routes requiring basic authentication
  {
    path: '/profile',
    requireAuth: true,
    requiredPermission: 'update_own_profile',
    description: 'User profile page'
  },
  {
    path: '/settings',
    requireAuth: true,
    requiredPermission: 'update_own_profile',
    description: 'User settings page'
  },
  
  // Admin routes requiring admin permissions
  {
    path: '/',
    requireAuth: true,
    requiredPermission: 'view_admin_dashboard',
    reVerifyForAdmin: true,
    redirectTo: '/auth/login',
    description: 'Main dashboard (admin only)'
  },
  {
    path: '/admin',
    requireAuth: true,
    requiredPermission: 'view_admin_dashboard',
    reVerifyForAdmin: true,
    description: 'Admin dashboard'
  },
  
  // Specific admin functionality routes (must come before wildcard)
  {
    path: '/admin/members',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Member management'
  },
  {
    path: '/admin/pastors',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Pastor management'
  },
  {
    path: '/admin/pastors/:pastorId',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Individual pastor details'
  },
  {
    path: '/admin/events',
    requireAuth: true,
    requiredPermission: 'manage_events',
    reVerifyForAdmin: true,
    description: 'Event management'
  },
  {
    path: '/admin/sermons',
    requireAuth: true,
    requiredPermission: 'manage_events',
    reVerifyForAdmin: true,
    description: 'Sermon management'
  },
  {
    path: '/admin/users',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'User management'
  },
  {
    path: '/admin/system',
    requireAuth: true,
    requiredPermission: 'system_admin',
    reVerifyForAdmin: true,
    description: 'System administration'
  },
  {
    path: '/admin/settings',
    requireAuth: true,
    requiredPermission: 'system_admin',
    reVerifyForAdmin: true,
    description: 'Admin settings'
  },
  {
    path: '/admin/profile',
    requireAuth: true,
    requiredPermission: 'view_admin_dashboard',
    reVerifyForAdmin: true,
    description: 'Admin profile'
  },
  
  // Church unit routes
  {
    path: '/admin/units/3hmedia',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: '3H Media unit management'
  },
  {
    path: '/admin/units/3hmusic',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: '3H Music unit management'
  },
  {
    path: '/admin/units/3hmovies',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: '3H Movies unit management'
  },
  {
    path: '/admin/units/3hsecurity',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: '3H Security unit management'
  },
  {
    path: '/admin/units/discipleship',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Discipleship unit management'
  },
  {
    path: '/admin/units/praisefeet',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Praise Feet unit management'
  },
  {
    path: '/admin/units/ushering',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Ushering unit management'
  },
  {
    path: '/admin/units/sanitation',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Sanitation unit management'
  },
  {
    path: '/admin/units/tof',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'TOF unit management'
  },
  {
    path: '/admin/units/cloventongues',
    requireAuth: true,
    requiredPermission: 'manage_members',
    reVerifyForAdmin: true,
    description: 'Cloven Tongues unit management'
  },
  
  // Special access route
  {
    path: '/admin-access',
    requireAuth: true,
    description: 'Admin access verification'
  },
  
  // Wildcard admin routes (must come last)
  {
    path: '/admin/*',
    requireAuth: true,
    requiredPermission: 'view_admin_dashboard',
    reVerifyForAdmin: true,
    description: 'All other admin routes'
  }
];

/**
 * Get route protection configuration for a specific path
 */
export function getRouteConfig(path: string): RouteProtectionConfig | null {
  // Find exact match first
  let config = routeProtectionConfig.find(route => route.path === path);
  
  if (!config) {
    // Find pattern match (for dynamic routes)
    config = routeProtectionConfig.find(route => {
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
}

/**
 * Check if a route requires authentication
 */
export function routeRequiresAuth(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.requireAuth ?? false;
}

/**
 * Get required permission for a route
 */
export function getRequiredPermission(path: string): string | null {
  const config = getRouteConfig(path);
  return config?.requiredPermission || null;
}

/**
 * Get required role for a route
 */
export function getRequiredRole(path: string): string | null {
  const config = getRouteConfig(path);
  return config?.requiredRole || null;
}

/**
 * Check if a route requires admin re-verification
 */
export function routeRequiresReVerification(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.reVerifyForAdmin ?? false;
}

/**
 * Get redirect path for unauthorized access
 */
export function getRedirectPath(path: string): string {
  const config = getRouteConfig(path);
  return config?.redirectTo || '/auth/login';
}