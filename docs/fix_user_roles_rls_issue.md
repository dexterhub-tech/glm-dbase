# Fixing the User Roles RLS Issue

This document explains how to fix the "Error creating user: new row violates row-level security policy for table 'user_roles'" issue.

## The Problem

The error occurs when trying to add a new user with admin privileges. The issue is related to Row-Level Security (RLS) policies on the `user_roles` table in Supabase. The current policies are preventing the insertion of new roles, even by users who should have permission to do so.

## The Solution

We've created a comprehensive fix that includes:

1. SQL scripts to properly configure RLS policies
2. Helper functions to safely add and remove user roles
3. Updated components to use these helper functions

## Steps to Fix the Issue

### 1. Run the SQL Script

First, run the `fix_user_roles_rls.sql` script in the Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of `src/integrations/supabase/fix_user_roles_rls.sql`
4. Run the script

This script will:
- Configure proper RLS policies for the `user_roles` table
- Create helper functions to safely add and remove roles
- Grant necessary permissions to authenticated users

### 2. Update Your Code

We've already updated the following components to use the new safe methods:

- `AddUserDialog.tsx` - Now uses `addUserRoleSafe` to add admin roles
- `EditUserDialog.tsx` - Now uses both `addUserRoleSafe` and `removeUserRoleSafe`

The updated code is more secure and bypasses RLS issues by using SECURITY DEFINER functions.

### 3. Test the Fix

After applying these changes, test the following scenarios:

1. Create a new user with admin privileges
2. Edit an existing user to add admin privileges
3. Edit an existing user to remove admin privileges

All of these operations should now work without any RLS errors.

## How the Fix Works

### RLS Policies

The SQL script sets up the following RLS policies:

1. **Allow service role full access** - Allows the application's service role to perform all operations
2. **Allow full access to superusers** - Allows superusers to manage all roles
3. **Allow admins to manage regular users** - Allows admins to manage regular users but not other admins or superusers
4. **Allow users to read their own roles** - Allows users to see their own roles

### Helper Functions

We've created several helper functions:

1. **admin_add_user_role** - Safely adds a role to a user
2. **admin_remove_user_role** - Safely removes a role from a user
3. **is_superuser** - Checks if the current user is a superuser
4. **is_admin** - Checks if the current user is an admin

These functions use the SECURITY DEFINER attribute, which means they run with the privileges of the function creator (the database owner) rather than the calling user. This bypasses RLS policies.

### TypeScript Utilities

We've also created TypeScript utility functions in `src/utils/roleManagement.ts`:

1. **addUserRoleSafe** - Calls the `admin_add_user_role` function
2. **removeUserRoleSafe** - Calls the `admin_remove_user_role` function
3. **checkIsSuperUser** - Checks if the current user is a superuser
4. **checkIsAdmin** - Checks if the current user is an admin
5. **getUserRoles** - Gets all roles for a specific user

## Conclusion

This comprehensive fix addresses the RLS issue by:

1. Setting up proper RLS policies
2. Creating helper functions that bypass RLS when needed
3. Updating components to use these helper functions

After applying these changes, you should no longer see the "Error creating user: new row violates row-level security policy for table 'user_roles'" error.
