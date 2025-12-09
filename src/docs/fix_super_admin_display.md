# Fix Super Admin Display Issues

This guide provides steps to fix issues with super admin display in the dashboard.

## Problem Description

1. Super admins are not showing up in the "Current Super Admins" list
2. The dashboard shows only one user when there should be multiple super admins

## Diagnostic Steps

Before applying the fixes, run the diagnostic script to check the current state of super admins in your database:

```bash
node src/scripts/check_super_admins.js
```

This script will:
1. Check the `user_roles` table for superuser roles
2. Test the `list_super_admins` function
3. Get user details for any superuser roles
4. Test a direct SQL query with joins

## Fix 1: Update the list_super_admins Function

The main issue is likely with the `list_super_admins` function. Apply the fix:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `src/integrations/supabase/fix_list_super_admins.sql`
5. Run the query

This will:
- Drop and recreate the `list_super_admins` function with a JSONB return type
- Create helper functions to check and ensure the 'superuser' role exists in the app_role enum
- Add better error handling and logging

## Fix 2: Verify the app_role Enum

Make sure the 'superuser' value exists in the app_role enum:

```sql
-- Check if 'superuser' exists in the app_role enum
SELECT * FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'app_role';

-- Add 'superuser' to the app_role enum if it doesn't exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';
```

## Fix 3: Add a Test Super Admin

To verify the fix, add a test super admin:

```bash
node src/scripts/add_test_super_admin.js your-email@example.com
```

Replace `your-email@example.com` with an email that exists in your auth.users table.

## Fix 4: Update the SuperAdminService.ts File

If the above fixes don't resolve the issue, check the `SuperAdminService.ts` file:

```typescript
export const listSuperAdmins = async (): Promise<{ superAdmins: SuperAdmin[], error: Error | null }> => {
  try {
    // Call the SQL function to list super admins
    const { data, error } = await supabase.rpc('list_super_admins');

    if (error) {
      console.error('Error listing super admins:', error);
      return { superAdmins: [], error };
    }

    // Log the raw data for debugging
    console.log('Raw super admins data:', data);
    
    // Handle different data formats
    let superAdmins: SuperAdmin[] = [];
    
    if (Array.isArray(data)) {
      // If data is already an array, use it directly
      superAdmins = data;
    } else if (data && typeof data === 'object') {
      // If data is a JSON object, try to convert it to an array
      try {
        // If it's a JSON string, parse it
        if (typeof data === 'string') {
          superAdmins = JSON.parse(data);
        } else {
          // If it has array-like properties, convert to array
          const keys = Object.keys(data).filter(k => !isNaN(Number(k)));
          if (keys.length > 0) {
            superAdmins = keys.map(k => data[k]);
          }
        }
      } catch (e) {
        console.error('Error parsing super admins data:', e);
      }
    }
    
    console.log('Processed super admins:', superAdmins);
    
    return { superAdmins, error: null };
  } catch (error: any) {
    console.error('Exception listing super admins:', error);
    return { superAdmins: [], error };
  }
};
```

## Fix 5: Check for Direct Database Issues

If you're still having issues, check the database directly:

```sql
-- Check user_roles table
SELECT * FROM public.user_roles WHERE role = 'superuser';

-- Check if users exist in auth.users
SELECT * FROM auth.users WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'superuser'
);

-- Check if profiles exist
SELECT * FROM public.profiles WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'superuser'
);
```

## Fix 6: Add Super Admins Directly to the Database

If needed, you can add super admins directly to the database:

```sql
-- First, get the user ID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then add the superuser role (replace USER_ID with the actual ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID', 'superuser');
```

## Verification

After applying the fixes:

1. Refresh your application
2. Open the Super Admin Management dialog
3. Verify that all super admins are displayed in the list
4. Try adding a new super admin and check if it appears in the list

## Troubleshooting

If you're still having issues:

1. Check the browser console for any JavaScript errors
2. Look at the network requests to see the exact response from the Supabase functions
3. Verify that the SQL functions were updated correctly in Supabase
4. Clear browser cache and local storage
