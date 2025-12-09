# Role Management System

This document outlines the role management system for the GLM Base application.

## Current Implementation

The application currently uses two different approaches for role management:

1. **profiles.role** - A legacy field in the profiles table that stores a single role for each user.
2. **user_roles table** - A dedicated table that allows multiple roles per user.

This dual approach can lead to inconsistencies and confusion.

## Recommended Approach

We recommend standardizing on the **user_roles table** for all role management:

1. The `user_roles` table allows for multiple roles per user (e.g., a user can be both an admin and a pastor).
2. It follows database normalization principles by separating roles into their own table.
3. It's already the primary source of role information in most of the application.

## Migration Plan

1. Run the `standardize_role_management.sql` script to:
   - Migrate any roles from `profiles.role` to the `user_roles` table
   - Create a view and functions to simplify role queries
   - Update database documentation

2. Update the `AuthContext.tsx` file to only check roles from the `user_roles` table.

3. Update any components that still reference `profiles.role` to use the `user_roles` table instead.

## Role Hierarchy

The application uses the following role hierarchy (from highest to lowest):

1. **superuser** - Complete access to all system features and administrative functions
2. **admin** - Access to manage members, events, and basic church operations
3. **user** - Regular church members who can view their profiles

## SQL Helpers

The `standardize_role_management.sql` script creates the following helpers:

### user_roles_view

A view that provides a simplified way to query user roles:

```sql
SELECT * FROM public.user_roles_view WHERE email = 'user@example.com';
```

### get_user_highest_role

A function to get a user's highest role:

```sql
SELECT public.get_user_highest_role('user-uuid-here');
```

### user_has_role

A function to check if a user has a specific role:

```sql
SELECT public.user_has_role('user-uuid-here', 'admin');
```

## Best Practices

1. Always use the `user_roles` table for role management.
2. Use the provided SQL helpers for role queries.
3. When checking if a user is an admin, also check if they are a superuser (as superusers have admin privileges).
4. Use the `isSuperUser` and `isAdmin` properties from the `AuthContext` for role-based UI rendering.

## Example Usage in Components

```tsx
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { isAdmin, isSuperUser } = useAuth();
  
  // Show admin content if the user is an admin or superuser
  const showAdminContent = isAdmin || isSuperUser;
  
  // Show superuser-only content
  const showSuperUserContent = isSuperUser;
  
  return (
    <div>
      {showAdminContent && <AdminSection />}
      {showSuperUserContent && <SuperUserSection />}
    </div>
  );
};
```
