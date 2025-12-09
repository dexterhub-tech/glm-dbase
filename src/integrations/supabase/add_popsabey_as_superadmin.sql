-- SQL script to add popsabey1@gmail.com as a super admin
-- Run this in the Supabase SQL Editor

-- 1. First, check if the app_role enum has the 'superuser' value
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
    
    -- Add 'superuser' to the app_role enum if it doesn't exist
    IF NOT has_superuser THEN
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';
        RAISE NOTICE 'Added ''superuser'' to app_role enum';
    ELSE
        RAISE NOTICE 'The ''superuser'' value already exists in the app_role enum';
    END IF;
END $$;

-- 2. Add popsabey1@gmail.com as a super admin using the add_super_admin_by_email function
SELECT public.add_super_admin_by_email('popsabey1@gmail.com');

-- 3. Verify that popsabey1@gmail.com is now a super admin
SELECT * FROM public.list_super_admins();

-- 4. If the function doesn't exist or fails, add the super admin role directly
DO $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Get the user ID for popsabey1@gmail.com
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = 'popsabey1@gmail.com';
    
    IF user_id_var IS NULL THEN
        RAISE NOTICE 'User with email popsabey1@gmail.com not found';
        RETURN;
    END IF;
    
    -- Check if the user already has the superuser role
    IF EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = user_id_var
        AND role = 'superuser'
    ) THEN
        RAISE NOTICE 'User already has superuser role';
        RETURN;
    END IF;
    
    -- Add the superuser role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_var, 'superuser');
    
    RAISE NOTICE 'Added superuser role to popsabey1@gmail.com';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding superuser role: %', SQLERRM;
END $$;
