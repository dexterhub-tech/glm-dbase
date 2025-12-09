# Fixing Admin Dashboard Issues

This document provides solutions for two issues in the admin dashboard:

1. "Continuing with limited functionality" message
2. Admin user list not showing current admin users

## Issue 1: "Continuing with limited functionality" Message

### Root Cause

This message appears when there's a timeout in the authentication process. The application has timeout mechanisms that show this message if authentication takes too long to complete.

### Solution

#### Option 1: Increase Authentication Timeouts

1. Open `src/contexts/AuthContext.tsx`
2. Find the timeout values and increase them:
   - Increase the auth initialization timeout from 10 seconds to 30 seconds
   - Increase the session fetch timeout from 5 seconds to 15 seconds
   - Increase the profile fetch timeout from 5 seconds to 15 seconds

```javascript
// Auth initialization timeout
const authTimeoutId = setTimeout(() => {
  if (isLoading) {
    console.warn("[AuthContext] Auth initialization timed out after 30 seconds");
    setIsLoading(false);
  }
}, 30000); // Increased from 10 seconds to 30 seconds

// Session fetch timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Session fetch timeout")), 15000) // Increased from 5 seconds to 15 seconds
);

// Profile fetch timeout
const profileFetchTimeout = setTimeout(() => {
  console.warn('[AuthContext] Profile fetch timed out after 15 seconds');
  setIsLoading(false);
}, 15000); // Increased from 5 seconds to 15 seconds
```

#### Option 2: Fix Supabase Connection Issues

1. Check your Supabase project status at https://app.supabase.com/
2. Ensure your project is not in a paused state
3. Check for any network issues between your application and Supabase
4. Verify that your Supabase API keys are correct in your environment variables

#### Option 3: Implement Better Error Handling

Add more robust error handling to gracefully recover from authentication issues:

```javascript
try {
  // Authentication code
} catch (error) {
  console.error("[AuthContext] Authentication error:", error);
  // Set a default state that allows basic functionality
  setIsAdmin(false);
  setIsSuperUser(false);
  setIsLoading(false);
  // Show a user-friendly error message
  toast({
    variant: "destructive",
    title: "Authentication issue",
    description: "There was a problem with authentication. Some features may be limited.",
  });
}
```

## Issue 2: Admin User List Not Showing Current Admin Users

### Root Cause

The issue is likely in how admin users are fetched and displayed. The current implementation might have issues with the join between profiles and user_roles tables.

### Solution

#### Step 1: Improve the User Management Service

Replace the content of `src/components/admin/users/UserManagementService.ts` with the improved version:

```javascript
import { supabase } from "@/integrations/supabase/client";
import { AdminUser } from "./types";

export const fetchUsers = async (): Promise<{ users: AdminUser[]; error: Error | null }> => {
  try {
    console.log("Fetching users from profiles table...");
    
    // First, fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profilesData?.length || 0} profiles`);
    
    // Then, fetch all user roles
    console.log("Fetching user roles...");
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      throw rolesError;
    }

    console.log(`Found ${rolesData?.length || 0} user roles`);
    
    // Log the roles for debugging
    if (rolesData && rolesData.length > 0) {
      console.log("Sample role data:", rolesData[0]);
    } else {
      console.warn("No user roles found in the database");
    }

    // Map profiles with their roles
    const usersWithRoles = profilesData.map((profile) => {
      // Find all roles for this user
      const userRoles = rolesData.filter((role) => role.user_id === profile.id);
      
      // Determine the highest role (superuser > admin > user)
      let highestRole = "user";
      if (userRoles.some(r => r.role === "superuser")) {
        highestRole = "superuser";
      } else if (userRoles.some(r => r.role === "admin")) {
        highestRole = "admin";
      }
      
      return {
        ...profile,
        role: highestRole,
      };
    });

    console.log(`Processed ${usersWithRoles.length} users with roles`);
    
    return { users: usersWithRoles, error: null };
  } catch (error: any) {
    console.error("Error in fetchUsers:", error);
    return { users: [], error };
  }
};
```

#### Step 2: Verify Database Tables

1. Check that the `user_roles` table has the correct structure:
   - `id` (UUID, primary key)
   - `user_id` (UUID, references auth.users.id)
   - `role` (app_role enum type)
   - `created_at` (timestamp)

2. Verify that there are entries in the `user_roles` table:
   ```sql
   SELECT * FROM public.user_roles;
   ```

3. Check that the join between profiles and user_roles works:
   ```sql
   SELECT p.id, p.email, p.full_name, r.role
   FROM public.profiles p
   LEFT JOIN public.user_roles r ON p.id = r.user_id;
   ```

#### Step 3: Add Error Handling to the UI

Update the UserTable component to show error states:

```jsx
const UserTable = ({ users, loading, error, onEdit, onDelete }: UserTableProps) => {
  if (loading) {
    return <UserTableLoading />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading users</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Table>
      {/* Table content */}
    </Table>
  );
};
```

## Verification

After implementing these changes:

1. Refresh the application and check if the "Continuing with limited functionality" message still appears
2. Go to the User Management section and verify that admin users are displayed correctly
3. Check the browser console for any error messages or warnings

## Additional Troubleshooting

If issues persist:

1. Clear browser cache and local storage
2. Check network requests in the browser developer tools
3. Verify that the Supabase functions for super admin management are working correctly
4. Check for any CORS issues in the network requests
