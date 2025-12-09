-- Fix superuser access for ojidelawrence@gmail.com
-- Run this script in the Supabase SQL Editor

-- 1. Add 'superuser' to the app_role enum if it doesn't exist
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

-- 2. Create function to add superuser role by email
CREATE OR REPLACE FUNCTION public.add_superuser_by_email(admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
    user_id_var UUID;
    result JSONB;
BEGIN
    -- Find the user ID by email in auth.users
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = admin_email;
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User with email ' || admin_email || ' not found'
        );
    END IF;
    
    -- Check if user already has superuser role
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_var 
        AND role = 'superuser'
    ) THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User ' || admin_email || ' already has superuser role'
        );
    END IF;
    
    -- Add superuser role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_var, 'superuser');
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Successfully added superuser role to ' || admin_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add superuser role to ojidelawrence@gmail.com
SELECT public.add_superuser_by_email('ojidelawrence@gmail.com');

-- 4. Also add superuser roles to other designated super admins
SELECT public.add_superuser_by_email('popsabey1@gmail.com');
SELECT public.add_superuser_by_email('dev.samadeyemi@gmail.com');

-- 5. Create function to list all super admins
CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
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

-- 6. Test by listing all super admins
SELECT public.list_super_admins();

-- 7. Verify the enum was updated
SELECT enumlabel AS role_name
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'app_role'
ORDER BY enumlabel;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.add_superuser_by_email TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_super_admins TO authenticated, service_role;

SELECT 'Superuser access setup completed successfully!' as status;