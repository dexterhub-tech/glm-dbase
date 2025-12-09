# Fix for Super Admin Management Errors

## Issue Description

There are two errors occurring in the Super Admin Management functionality:

1. **Error loading super admins**: "structure of query does not match function result type"
2. **Error adding super admin**: "Error: column reference 'user_id' is ambiguous"

## Root Cause

The issue is in the SQL functions that handle super admin management. The main problem is in the `add_super_admin_by_email` function where there's an ambiguous column reference:

```sql
-- This is causing the ambiguity
WHERE user_id = user_id
```

In this case, PostgreSQL can't determine if `user_id` refers to the column in the table or the variable declared in the function.

## Solution

We need to update the SQL functions to avoid ambiguity by:

1. Renaming the variable to avoid name collision with the column
2. Using table aliases to explicitly reference columns

## How to Apply the Fix

### Option 1: Using the Supabase SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `src/integrations/supabase/fix_superadmin_function.sql` file
6. Click "Run" to execute the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db execute --file=src/integrations/supabase/fix_superadmin_function.sql
```

## Verification

After applying the fix, you should:

1. Refresh your application
2. Try to add a super admin again
3. Verify that the list of super admins loads correctly

## Technical Details of the Fix

1. Changed the variable name from `user_id` to `user_id_var` to avoid ambiguity
2. Added table aliases (`ur`) to explicitly reference the `user_roles` table
3. Updated all references to use the new variable name and table aliases

## Preventative Measures

To prevent similar issues in the future:

1. Always use different names for variables and columns
2. Use table aliases in SQL queries, especially in joins
3. Test SQL functions with explicit parameter values before deploying

## Additional Resources

- [PostgreSQL Documentation on Name Resolution](https://www.postgresql.org/docs/current/sql-expressions.html#SQL-EXPRESSIONS-NAME-RESOLUTION)
- [Supabase SQL Best Practices](https://supabase.com/docs/guides/database/postgres/sql-best-practices)
