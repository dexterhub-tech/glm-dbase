-- This is a simplified script to fix super admin issues
-- Run this directly in the Supabase SQL Editor

-- 1. Check and add 'superuser' to the app_role enum if needed
DO $$
BEGIN
    -- Check if 'superuser' exists in the app_role enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'app_role'
        AND pg_enum.enumlabel = 'superuser'
    ) THEN
        -- Add 'superuser' to the app_role enum
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';
        RAISE NOTICE 'Added ''superuser'' to app_role enum';
    ELSE
        RAISE NOTICE 'The ''superuser'' value already exists in the app_role enum';
    END IF;
END $$;

-- 2. Fix the list_super_admins function
DROP FUNCTION IF EXISTS public.list_super_admins();

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
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in list_super_admins: %', SQLERRM;
        RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test the function
SELECT public.list_super_admins();
