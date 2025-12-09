-- Fix for the add_super_admin_by_email function
-- The issue is with ambiguous column references in the WHERE clauses

-- Create function to add a super admin by email (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.add_super_admin_by_email(admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
    user_id_var UUID;
    result JSONB;
    existing_role TEXT;
BEGIN
    -- Normalize email (convert to lowercase)
    admin_email := LOWER(admin_email);
    
    -- Check if the user exists
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = admin_email;
    
    IF user_id_var IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User with email ' || admin_email || ' not found',
            'status', 'NOT_FOUND'
        );
    END IF;
    
    -- Check if the user already has a superuser role
    -- Fixed: Use table alias and reference the variable with a different name
    SELECT ur.role INTO existing_role
    FROM public.user_roles ur
    WHERE ur.user_id = user_id_var
    AND ur.role = 'superuser';
    
    IF existing_role IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User is already a super admin',
            'status', 'ALREADY_SUPERUSER',
            'user_id', user_id_var
        );
    END IF;
    
    -- Remove any existing roles for this user
    -- Fixed: Reference the variable with a different name
    DELETE FROM public.user_roles
    WHERE user_id = user_id_var;
    
    -- Add superuser role
    -- Fixed: Reference the variable with a different name
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_var, 'superuser');
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User has been made a super admin',
        'status', 'SUCCESS',
        'user_id', user_id_var
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

-- Fix for the list_super_admins function
-- Use explicit table aliases to avoid ambiguity
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

-- Fix for the remove_super_admin function
CREATE OR REPLACE FUNCTION public.remove_super_admin(admin_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if the user exists and is a super admin
    -- Fixed: Use table alias
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = admin_id
        AND ur.role = 'superuser'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User is not a super admin',
            'status', 'NOT_SUPERUSER'
        );
    END IF;
    
    -- Remove superuser role
    -- Fixed: No ambiguity here, but adding table alias for consistency
    DELETE FROM public.user_roles ur
    WHERE ur.user_id = admin_id
    AND ur.role = 'superuser';
    
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
