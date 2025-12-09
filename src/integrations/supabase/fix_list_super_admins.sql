-- Drop the existing function
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

-- Create a function to check if the app_role enum has the 'superuser' value
CREATE OR REPLACE FUNCTION public.check_superuser_role()
RETURNS JSONB AS $$
DECLARE
    has_superuser BOOLEAN;
    result JSONB;
BEGIN
    -- Check if 'superuser' exists in the app_role enum
    SELECT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'app_role'
        AND pg_enum.enumlabel = 'superuser'
    ) INTO has_superuser;
    
    -- Return the result
    result := jsonb_build_object(
        'has_superuser_role', has_superuser
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'has_superuser_role', false
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to add the 'superuser' value to the app_role enum if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_superuser_role()
RETURNS JSONB AS $$
DECLARE
    has_superuser BOOLEAN;
    result JSONB;
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
        result := jsonb_build_object(
            'success', true,
            'message', 'Added superuser to app_role enum'
        );
    ELSE
        result := jsonb_build_object(
            'success', true,
            'message', 'superuser already exists in app_role enum'
        );
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to list all roles in the app_role enum
CREATE OR REPLACE FUNCTION public.list_app_roles()
RETURNS JSONB AS $$
DECLARE
    roles JSONB;
BEGIN
    SELECT jsonb_agg(enumlabel) INTO roles
    FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'app_role';
    
    RETURN jsonb_build_object(
        'roles', COALESCE(roles, '[]'::jsonb)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'roles', '[]'::jsonb
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
