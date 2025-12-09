-- SQL script to standardize role management
-- Run this in the Supabase SQL editor

-- 1. Migrate any roles from profiles.role to user_roles table
DO $$
DECLARE
    profile_record RECORD;
    role_exists BOOLEAN;
BEGIN
    -- Check if profiles table has a role column
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        -- For each profile with a role
        FOR profile_record IN
            SELECT id, role FROM public.profiles
            WHERE role IS NOT NULL AND role != 'user'
        LOOP
            -- Check if the role already exists in user_roles
            SELECT EXISTS (
                SELECT 1
                FROM public.user_roles
                WHERE user_id = profile_record.id
                AND role = profile_record.role
            ) INTO role_exists;

            -- If role doesn't exist in user_roles, add it
            IF NOT role_exists THEN
                INSERT INTO public.user_roles (user_id, role)
                VALUES (profile_record.id, profile_record.role);
                RAISE NOTICE 'Added role % for user %', profile_record.role, profile_record.id;
            END IF;
        END LOOP;

        -- Comment out the role column in profiles table
        -- We don't remove it to avoid breaking existing code
        COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead. This column is kept for backward compatibility.';

        RAISE NOTICE 'Role migration completed. The role column in profiles table has been marked as deprecated.';
    ELSE
        RAISE NOTICE 'No role column found in profiles table. No migration needed.';
    END IF;
END $$;

-- 2. Create a view to simplify role queries
DO $$
BEGIN
    EXECUTE 'CREATE OR REPLACE VIEW public.user_roles_view AS
    SELECT
        p.id,
        p.email,
        p.full_name,
        COALESCE(
            (SELECT role FROM public.user_roles WHERE user_id = p.id AND role = ''superuser'' LIMIT 1),
            (SELECT role FROM public.user_roles WHERE user_id = p.id AND role = ''admin'' LIMIT 1),
            ''user''
        ) AS highest_role,
        ARRAY(
            SELECT role FROM public.user_roles WHERE user_id = p.id
        ) AS all_roles
    FROM
        public.profiles p';

    RAISE NOTICE 'Successfully created user_roles_view';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user_roles_view: %', SQLERRM;
END $$;

-- 3. Create a function to get a user's highest role
DO $$
BEGIN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.get_user_highest_role(user_id UUID)
    RETURNS TEXT AS $BODY$
    DECLARE
        highest_role TEXT;
    BEGIN
        -- Check for superuser role first
        SELECT role INTO highest_role
        FROM public.user_roles
        WHERE user_id = $1 AND role = 'superuser'
        LIMIT 1;

        -- If not superuser, check for admin role
        IF highest_role IS NULL THEN
            SELECT role INTO highest_role
            FROM public.user_roles
            WHERE user_id = $1 AND role = 'admin'
            LIMIT 1;
        END IF;

        -- Default to 'user' if no other roles found
        RETURN COALESCE(highest_role, 'user');
    END;
    $BODY$ LANGUAGE plpgsql SECURITY DEFINER;
    $FUNC$;

    RAISE NOTICE 'Successfully created get_user_highest_role function';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating get_user_highest_role function: %', SQLERRM;
END $$;

-- 4. Create a function to check if a user has a specific role
DO $$
BEGIN
    EXECUTE $FUNC$
    CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_to_check TEXT)
    RETURNS BOOLEAN AS $BODY$
    BEGIN
        RETURN EXISTS (
            SELECT 1
            FROM public.user_roles
            WHERE user_id = $1 AND role = $2
        );
    END;
    $BODY$ LANGUAGE plpgsql SECURITY DEFINER;
    $FUNC$;

    RAISE NOTICE 'Successfully created user_has_role function';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user_has_role function: %', SQLERRM;
END $$;

-- 5. Update the database schema documentation
DO $$
BEGIN
    -- Add comment to user_roles table
    BEGIN
        COMMENT ON TABLE public.user_roles IS 'Stores role assignments for users. This is the primary source of role information.';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not add comment to user_roles table: %', SQLERRM;
    END;

    -- Add comment to user_roles_view view
    BEGIN
        COMMENT ON VIEW public.user_roles_view IS 'View that provides a simplified way to query user roles.';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not add comment to user_roles_view view: %', SQLERRM;
    END;
END $$;
