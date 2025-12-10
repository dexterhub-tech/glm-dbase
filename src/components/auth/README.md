# Authentication Guard and Route Protection System

This directory contains a comprehensive authentication guard and route protection system that implements the requirements from task 8 of the auth-dashboard-fix specification.

## Components

### Core Components

#### `AuthGuard.tsx`
The main authentication guard component that wraps content and enforces authentication and authorization rules.

**Features:**
- Authentication verification
- Permission-based access control
- Role-based access control
- Loading states during verification
- Proper redirect handling for unauthorized access
- Re-verification for admin features
- Comprehensive logging

**Usage:**
```tsx
<AuthGuard 
  requireAuth={true}
  requiredPermission="view_admin_dashboard"
  reVerifyForAdmin={true}
>
  <ProtectedContent />
</AuthGuard>
```

#### `RouteGuard.tsx`
A route-level guard that can protect multiple routes based on configuration.

**Features:**
- Route-based protection configuration
- Pattern matching for dynamic routes
- Centralized route protection logic
- Automatic redirect handling

**Usage:**
```tsx
<RouteGuard 
  routes={routeProtectionConfig}
  defaultRedirect="/auth/login"
>
  <Routes>
    {/* Your routes */}
  </Routes>
</RouteGuard>
```

#### `ProtectedRoute.tsx`
A wrapper component that combines React Router's Route with AuthGuard.

**Usage:**
```tsx
<ProtectedRoute 
  path="/admin"
  element={<AdminDashboard />}
  requireAuth={true}
  requiredPermission="view_admin_dashboard"
  reVerifyForAdmin={true}
/>
```

### Higher-Order Components

#### `withRouteProtection.tsx`
HOC for wrapping components with route-level protection.

**Convenience HOCs:**
- `withAuthRequired` - Requires authentication
- `withAdminRoute` - Requires admin dashboard permission
- `withSuperAdminRoute` - Requires system admin permission
- `withMemberManagementRoute` - Requires member management permission
- `withPublicRoute` - No authentication required

**Usage:**
```tsx
const ProtectedComponent = withAdminRoute(MyComponent);
```

### Configuration

#### `routeConfig.ts`
Centralized configuration for route protection requirements.

**Features:**
- Declarative route protection rules
- Support for dynamic routes with parameters
- Wildcard route matching
- Permission and role requirements per route

**Configuration Example:**
```typescript
{
  path: '/admin/members',
  requireAuth: true,
  requiredPermission: 'manage_members',
  reVerifyForAdmin: true,
  description: 'Member management'
}
```

### Existing Components (Enhanced)

#### `PermissionGuard.tsx`
Component-level permission checking (existing, enhanced with new features).

#### `withRoleProtection.tsx`
HOC for role-based component protection (existing, works with new system).

#### `AccessDenied.tsx`
User-friendly access denied page with retry and contact options.

## Implementation Details

### Authentication Flow

1. **Route Access**: User navigates to a protected route
2. **Guard Activation**: AuthGuard or RouteGuard intercepts the request
3. **Authentication Check**: Verifies user is authenticated
4. **Permission Check**: Verifies user has required permissions
5. **Role Check**: Verifies user has required role (if specified)
6. **Re-verification**: Re-verifies admin permissions if required
7. **Access Decision**: Grants access or shows access denied/redirects

### Loading States

The system provides loading indicators during:
- Initial authentication verification
- Permission re-verification
- Route transition verification

### Error Handling

Comprehensive error handling for:
- Authentication timeouts
- Network connectivity issues
- Permission verification failures
- Invalid session states

### Logging

All authentication and authorization events are logged with:
- User identification
- Route information
- Permission details
- Success/failure status
- Performance metrics

## Integration with App.tsx

The main application has been updated to use the authentication guard system:

```tsx
<RouteGuard 
  routes={routeProtectionConfig}
  defaultRedirect="/auth/login"
>
  <Routes>
    <Route 
      path="/admin" 
      element={
        <AuthGuard 
          requireAuth={true} 
          requiredPermission="view_admin_dashboard"
          reVerifyForAdmin={true}
        >
          <AdminDashboard />
        </AuthGuard>
      } 
    />
    {/* Other routes */}
  </Routes>
</RouteGuard>
```

## Testing

The system includes comprehensive tests:

- `AuthGuard.test.tsx` - Unit tests for the core AuthGuard component
- Tests cover authentication, authorization, loading states, and error conditions

## Requirements Fulfilled

This implementation fulfills all requirements from task 8:

✅ **Implement authentication guard for protected routes**
- AuthGuard component provides comprehensive route protection
- Integrates with existing AuthContext for authentication state

✅ **Add role-based route access control**
- Support for both permission-based and role-based access control
- Re-verification for admin features
- Fallback to default permissions when role data is missing

✅ **Create proper redirect handling for unauthorized access**
- Automatic redirects to login page for unauthenticated users
- Preserves intended destination for post-login redirect
- Access denied pages for insufficient permissions

✅ **Add loading states during route verification**
- Loading indicators during authentication checks
- Loading states during permission re-verification
- Proper loading state management throughout the verification process

## Security Features

- **Permission Re-verification**: Admin routes can require fresh permission checks
- **Session Validation**: Integration with enhanced session management
- **Comprehensive Logging**: All access attempts are logged for security monitoring
- **Graceful Degradation**: Fallback mechanisms for various failure scenarios
- **Network Awareness**: Handles offline scenarios and connection issues

## Performance Considerations

- **Lazy Loading**: Components are lazy-loaded to reduce initial bundle size
- **Caching**: Permission checks are cached to avoid repeated API calls
- **Efficient Re-renders**: Optimized to minimize unnecessary re-renders
- **Performance Monitoring**: Built-in performance metrics collection