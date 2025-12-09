-- This script checks and fixes super admin issues
-- Run this directly in the Supabase SQL Editor

-- 1. Check if 'superuser' exists in the app_role enum
DO $$
DECLARE
    has_superuser BOOLEAN;
BEGIN
    -- Check if 'superuser' exists in the app_role enum
    SELECT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'app_role'
        AND pg_enum.enumlabel = 'superuser'
    ) INTO has_superuser;
    
    IF has_superuser THEN
        RAISE NOTICE 'The ''superuser'' value exists in the app_role enum';
    ELSE
        RAISE NOTICE 'The ''superuser'' value does NOT exist in the app_role enum';
        
        -- Add 'superuser' to the app_role enum
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';
        RAISE NOTICE 'Added ''superuser'' to app_role enum';
    END IF;
END $$;

-- 2. List all values in the app_role enum
SELECT enumlabel AS role_name
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'app_role'
ORDER BY enumlabel;

-- 3. Check for super admins in the user_roles table
SELECT 
    ur.user_id,
    ur.role,
    ur.created_at
FROM 
    public.user_roles ur
WHERE 
    ur.role = 'superuser';

-- 4. Check if the super admin users exist in auth.users
-- Note: This requires admin privileges
SELECT 
    u.id,
    u.email,
    u.created_at
FROM 
    auth.users u
WHERE 
    u.id IN (
        SELECT user_id FROM public.user_roles WHERE role = 'superuser'
    );

-- 5. Check if the super admin users have profiles
SELECT 
    p.id,
    p.email,
    p.full_name
FROM 
    public.profiles p
WHERE 
    p.id IN (
        SELECT user_id FROM public.user_roles WHERE role = 'superuser'
    );

-- 6. Test the list_super_admins function
-- First, drop the existing function
DROP FUNCTION IF EXISTS public.list_super_admins();

-- Create a new version of the function that returns a JSONB array
CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Build a JSON array of super admins with explicit table aliases
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'user_id', u.id,
                'email', u.email,
                'full_name', p.full_name,
                'created_at', r.created_at
            )
        ) INTO result
    FROM 
        public.user_roles r
    JOIN 
        auth.users u ON r.user_id = u.id
    LEFT JOIN 
        public.profiles p ON u.id = p.id
    WHERE 
        r.role = 'superuser'
    ORDER BY 
        r.created_at DESC;
    
    -- Handle case where no super admins are found
    IF result IS NULL THEN
        result := '[]'::jsonb;
    END IF;
    
    -- Log the result for debugging
    RAISE NOTICE 'list_super_admins result: %', result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in list_super_admins: %', SQLERRM;
        RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Call the list_super_admins function to test it
SELECT public.list_super_admins();

-- 8. Add a test super admin (replace with an actual email from your auth.users table)
-- Uncomment and modify the email to add a test super admin
/*
DO $$
DECLARE
    user_id_var UUID;
    admin_email TEXT := 'your-email@example.com'; -- Replace with an actual email
BEGIN
    -- Check if the user exists
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = admin_email;
    
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'User with email % not found', admin_email;
        RETURN;
    END IF;
    
    -- Check if the user already has a superuser role
    IF EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = user_id_var
        AND ur.role = 'superuser'
    ) THEN
        RAISE NOTICE 'User % is already a super admin', admin_email;
        RETURN;
    END IF;
    
    -- Add superuser role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_var, 'superuser');
    
    RAISE NOTICE 'Added super admin role to %', admin_email;
END $$;
*/

-- 9. Call the list_super_admins function again to verify
SELECT public.list_super_admins();
