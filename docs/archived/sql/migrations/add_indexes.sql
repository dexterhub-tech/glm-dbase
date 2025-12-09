-- SQL script to add indexes to frequently queried columns
-- This will improve query performance, especially for filtering and searching

-- Add indexes to the members table
DO $$
BEGIN
    -- Check if category index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_category'
    ) THEN
        CREATE INDEX idx_members_category ON public.members (category);
        RAISE NOTICE 'Created index on members.category';
    ELSE
        RAISE NOTICE 'Index on members.category already exists';
    END IF;

    -- Check if assignedTo index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_assigned_to'
    ) THEN
        CREATE INDEX idx_members_assigned_to ON public.members ("assignedTo");
        RAISE NOTICE 'Created index on members.assignedTo';
    ELSE
        RAISE NOTICE 'Index on members.assignedTo already exists';
    END IF;

    -- Check if churchUnit index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_church_unit'
    ) THEN
        CREATE INDEX idx_members_church_unit ON public.members ("churchUnit");
        RAISE NOTICE 'Created index on members.churchUnit';
    ELSE
        RAISE NOTICE 'Index on members.churchUnit already exists';
    END IF;

    -- Check if fullName index exists, if not add it (for search)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_full_name'
    ) THEN
        CREATE INDEX idx_members_full_name ON public.members ("fullName");
        RAISE NOTICE 'Created index on members.fullName';
    ELSE
        RAISE NOTICE 'Index on members.fullName already exists';
    END IF;

    -- Check if email index exists, if not add it (for search)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_email'
    ) THEN
        CREATE INDEX idx_members_email ON public.members (email);
        RAISE NOTICE 'Created index on members.email';
    ELSE
        RAISE NOTICE 'Index on members.email already exists';
    END IF;

    -- Check if isActive index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'members'
        AND indexname = 'idx_members_is_active'
    ) THEN
        CREATE INDEX idx_members_is_active ON public.members ("isActive");
        RAISE NOTICE 'Created index on members.isActive';
    ELSE
        RAISE NOTICE 'Index on members.isActive already exists';
    END IF;
END $$;

-- Add indexes to the profiles table
DO $$
BEGIN
    -- Check if email index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles'
        AND indexname = 'idx_profiles_email'
    ) THEN
        CREATE INDEX idx_profiles_email ON public.profiles (email);
        RAISE NOTICE 'Created index on profiles.email';
    ELSE
        RAISE NOTICE 'Index on profiles.email already exists';
    END IF;

    -- Check if church_unit index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles'
        AND indexname = 'idx_profiles_church_unit'
    ) THEN
        CREATE INDEX idx_profiles_church_unit ON public.profiles (church_unit);
        RAISE NOTICE 'Created index on profiles.church_unit';
    ELSE
        RAISE NOTICE 'Index on profiles.church_unit already exists';
    END IF;

    -- Check if assigned_pastor index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles'
        AND indexname = 'idx_profiles_assigned_pastor'
    ) THEN
        CREATE INDEX idx_profiles_assigned_pastor ON public.profiles (assigned_pastor);
        RAISE NOTICE 'Created index on profiles.assigned_pastor';
    ELSE
        RAISE NOTICE 'Index on profiles.assigned_pastor already exists';
    END IF;
END $$;

-- Add indexes to the user_roles table
DO $$
BEGIN
    -- Check if user_id index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'user_roles'
        AND indexname = 'idx_user_roles_user_id'
    ) THEN
        CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);
        RAISE NOTICE 'Created index on user_roles.user_id';
    ELSE
        RAISE NOTICE 'Index on user_roles.user_id already exists';
    END IF;

    -- Check if role index exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'user_roles'
        AND indexname = 'idx_user_roles_role'
    ) THEN
        CREATE INDEX idx_user_roles_role ON public.user_roles (role);
        RAISE NOTICE 'Created index on user_roles.role';
    ELSE
        RAISE NOTICE 'Index on user_roles.role already exists';
    END IF;
END $$;

-- Verify the indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND (tablename = 'members' OR tablename = 'profiles' OR tablename = 'user_roles')
ORDER BY
    tablename,
    indexname;
