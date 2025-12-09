-- First, check if 'superuser' exists in the app_role enum
DO $$
BEGIN
    -- Check if 'superuser' already exists in the app_role enum
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
        RAISE NOTICE 'Value ''superuser'' already exists in app_role enum';
    END IF;
END $$;

-- Create function to add a super admin by email
CREATE OR REPLACE FUNCTION public.add_super_admin_by_email(admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
    user_id UUID;
    result JSONB;
    existing_role TEXT;
BEGIN
    -- Normalize email (convert to lowercase)
    admin_email := LOWER(admin_email);
    
    -- Check if the user exists
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User with email ' || admin_email || ' not found',
            'status', 'NOT_FOUND'
        );
    END IF;
    
    -- Check if the user already has a superuser role
    SELECT role INTO existing_role
    FROM public.user_roles
    WHERE user_id = user_id
    AND role = 'superuser';
    
    IF existing_role IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User is already a super admin',
            'status', 'ALREADY_SUPERUSER',
            'user_id', user_id
        );
    END IF;
    
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles
    WHERE user_id = user_id;
    
    -- Add superuser role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id, 'superuser');
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User has been made a super admin',
        'status', 'SUCCESS',
        'user_id', user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'status', 'ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to list all super admins
CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        p.full_name,
        r.created_at
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove super admin
CREATE OR REPLACE FUNCTION public.remove_super_admin(admin_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if the user exists and is a super admin
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = admin_id
        AND role = 'superuser'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User is not a super admin',
            'status', 'NOT_SUPERUSER'
        );
    END IF;
    
    -- Remove superuser role
    DELETE FROM public.user_roles
    WHERE user_id = admin_id
    AND role = 'superuser';
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Super admin role has been removed',
        'status', 'SUCCESS',
        'user_id', admin_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'status', 'ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
