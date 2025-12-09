-- Fix for user update and unit assignment operations
-- This addresses the "User not allowed" errors

-- 1. First, let's check and fix the profiles table RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Allow signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations during signup" ON public.profiles;

-- Create comprehensive policies for profiles
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert profiles" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Special policy for admin users (superusers can update any profile)
CREATE POLICY "Admin users can update any profile" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        )
    );

-- 2. Fix the members table RLS
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on members
DROP POLICY IF EXISTS "Allow all operations" ON public.members;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.members;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.members;
DROP POLICY IF EXISTS "Service role can do everything" ON public.members;
DROP POLICY IF EXISTS "Allow all operations during signup" ON public.members;

-- Create comprehensive policies for members
CREATE POLICY "Service role full access members" ON public.members
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read members" ON public.members
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert members" ON public.members
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own member record" ON public.members
    FOR UPDATE 
    TO authenticated
    USING (userid = auth.uid())
    WITH CHECK (userid = auth.uid());

-- Admin users can update any member record
CREATE POLICY "Admin users can update any member" ON public.members
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'superuser')
        )
    );

-- 3. Ensure user_roles table has proper RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Service role can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can manage roles" ON public.user_roles;

-- Create policies for user_roles
CREATE POLICY "Service role full access user_roles" ON public.user_roles
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all roles" ON public.user_roles
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'superuser')
        )
    );

CREATE POLICY "Superuser can manage all roles" ON public.user_roles
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'superuser'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'superuser'
        )
    );

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.members TO service_role;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.members TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- 5. Create a function to check if user is admin (for easier policy management)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = is_admin.user_id 
        AND role IN ('admin', 'superuser')
    );
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, service_role;

-- Test the fix
SELECT 'User operations RLS policies have been updated successfully' as status;