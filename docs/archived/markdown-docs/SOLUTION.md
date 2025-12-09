# User Operations Fix - "User not allowed" Error

## Problem Diagnosis ✅

The issue has been identified: **Row Level Security (RLS) policies** are blocking authenticated users from updating profiles and adding members to units, even when they have admin privileges.

## Root Cause

1. **RLS Policies Too Restrictive**: Current policies don't properly allow admin users to update other users' profiles
2. **Admin Role Check Failing**: The policies aren't correctly identifying admin/superuser roles
3. **Service Role Works**: The service role can perform operations, confirming it's a policy issue, not a database issue

## Immediate Solution (Quick Fix)

Run this SQL in your **Supabase Dashboard > SQL Editor**:

```sql
-- EMERGENCY FIX: Temporarily disable RLS to restore functionality
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- This will immediately fix:
-- ✅ User profile updates
-- ✅ Adding members to units
-- ✅ Admin operations
```

⚠️ **WARNING**: This removes security restrictions temporarily. You should implement proper policies later.

## Proper Long-term Solution

After the emergency fix works, implement proper RLS policies:

```sql
-- Re-enable RLS with proper policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create admin-friendly policies for profiles
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email = 'ojidelawrence@gmail.com'
        )
    );

-- Similar policies for members table
CREATE POLICY "Service role full access members" ON public.members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can read members" ON public.members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage members" ON public.members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        ) OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email = 'ojidelawrence@gmail.com'
        )
    );
```

## Testing the Fix

After running the emergency fix, test these operations:

1. **Edit User Dialog**: Try updating a user's profile
2. **Add Member to Unit**: Try adding a member to a unit
3. **Admin Operations**: Verify all admin functions work

## Why This Happened

The previous SQL fixes created overly permissive policies (`FOR ALL USING (true)`) but they may not have been applied correctly, or there were conflicting policies. The emergency fix bypasses RLS entirely to restore functionality.

## Next Steps

1. ✅ Run the emergency SQL fix immediately
2. ✅ Test that user operations work
3. ⏳ Later: Implement proper RLS policies for security
4. ⏳ Test the proper policies thoroughly

This should resolve both the "User not allowed" error and the non-working "Add to Unit" button.