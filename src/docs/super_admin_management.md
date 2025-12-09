# Super Admin Management

This document explains how to manage super admins in the Gospel Labour Ministry application.

## What is a Super Admin?

A super admin has full access to all system features and can manage other administrators. Super admins can:

- Access all administrative features
- Manage other administrators
- Configure system settings
- Access sensitive data and operations

## Adding a Super Admin

There are three ways to add a super admin:

### 1. Using the Admin UI (Recommended)

1. Log in as an existing super admin
2. Go to the Admin Dashboard
3. Click on "User Management"
4. Click on "Manage Super Admins"
5. Enter the email address of the user you want to make a super admin
6. Click "Add Super Admin"

### 2. Using the SQL Function

You can run the SQL function directly in the Supabase SQL Editor:

```sql
SELECT public.add_super_admin_by_email('user@example.com');
```

### 3. Using the Command Line Script

You can use the provided script to add a super admin:

1. Make sure you have the Supabase CLI installed
2. Set up your environment variables in a `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run the script:
   ```
   node src/scripts/add_superadmin.js user@example.com
   ```

## Removing a Super Admin

To remove a super admin:

1. Log in as a super admin
2. Go to the Admin Dashboard
3. Click on "User Management"
4. Click on "Manage Super Admins"
5. Find the super admin you want to remove
6. Click the trash icon to remove their super admin role

## Checking Super Admin Status

The system checks for super admin status in the following order:

1. Checks if the user has the 'superuser' role in the `user_roles` table
2. Checks if the user's email is in the hardcoded list of super admin emails
3. Checks if the user has super admin status stored in localStorage

## Troubleshooting

If you're having issues with super admin access:

1. Check that the user exists in the system
2. Verify that the user has the 'superuser' role in the `user_roles` table
3. Check if the app_role enum has been updated to include 'superuser'
4. Clear browser cache and localStorage
5. Try logging out and logging back in

## Security Considerations

- Super admin access should be granted sparingly
- Regularly audit the list of super admins
- Consider implementing additional security measures for super admin actions
- Monitor super admin activity in logs
