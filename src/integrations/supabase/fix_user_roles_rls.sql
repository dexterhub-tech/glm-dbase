-- SQL script to fix row-level security policies for the user_roles table
-- Run this in the Supabase SQL editor

-- First, check if RLS is enabled on the user_roles table
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT obj_description(oid, 'pg_class')::jsonb->>'security_type' = 'RLS'
    INTO rls_enabled
    FROM pg_class
    WHERE relname = 'user_roles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

    IF rls_enabled THEN
        RAISE NOTICE 'Row-level security is enabled on the user_roles table';
    ELSE
        RAISE NOTICE 'Row-level security is not enabled on the user_roles table';
    END IF;
END $$;

-- Enable RLS on the user_roles table if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    -- Try to drop the policy if it exists
    BEGIN
        DROP POLICY IF EXISTS "Allow full access to superusers" ON public.user_roles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Allow full access to superusers": %', SQLERRM;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Allow admins to manage regular users" ON public.user_roles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Allow admins to manage regular users": %', SQLERRM;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Allow users to read their own roles" ON public.user_roles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Allow users to read their own roles": %', SQLERRM;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Allow service role full access" ON public.user_roles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy "Allow service role full access": %', SQLERRM;
    END;
END $$;

-- Create a policy to allow the service role (used by the application) to have full access
CREATE POLICY "Allow service role full access"
ON public.user_roles
USING (true)
WITH CHECK (true);

-- Create a policy to allow superusers to manage all roles
CREATE POLICY "Allow full access to superusers"
ON public.user_roles
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'superuser'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'superuser'
    )
);

-- Create a policy to allow admins to manage regular users (but not other admins or superusers)
CREATE POLICY "Allow admins to manage regular users"
ON public.user_roles
USING (
    (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ))
    AND
    (role != 'superuser' AND role != 'admin')
)
WITH CHECK (
    (EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ))
    AND
    (role != 'superuser' AND role != 'admin')
);

-- Create a policy to allow users to read their own roles
CREATE POLICY "Allow users to read their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.user_roles_id_seq TO authenticated;

-- Create a function to add a user role with elevated privileges
CREATE OR REPLACE FUNCTION public.admin_add_user_role(
    user_id_param UUID,
    role_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_param, role_param);
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding role: %', SQLERRM;
        RETURN false;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.admin_add_user_role TO authenticated;

-- Create a function to remove a user role with elevated privileges
CREATE OR REPLACE FUNCTION public.admin_remove_user_role(
    user_id_param UUID,
    role_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.user_roles
    WHERE user_id = user_id_param AND role = role_param;
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error removing role: %', SQLERRM;
        RETURN false;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.admin_remove_user_role TO authenticated;

-- Create a function to check if the current user is a superuser
CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'superuser'
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_superuser TO authenticated;

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'superuser')
    );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
