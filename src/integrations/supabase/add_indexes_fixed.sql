-- SQL script to add indexes to frequently queried columns
-- This will improve query performance, especially for filtering and searching
-- This version first checks the actual column names in the database to handle case sensitivity

-- First, let's check the actual column names in the members table
DO $$
DECLARE
    actual_column_name text;
BEGIN
    -- Log the findings
    RAISE NOTICE 'Checking column names in members table:';

    -- Check for assignedto/assignedTo
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'assignedto'
    INTO actual_column_name;

    RAISE NOTICE 'Found assigned to column: %', actual_column_name;

    -- Check for churchunit/churchUnit
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'churchunit'
    INTO actual_column_name;

    RAISE NOTICE 'Found church unit column: %', actual_column_name;

    -- Check for fullname/fullName
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'fullname'
    INTO actual_column_name;

    RAISE NOTICE 'Found full name column: %', actual_column_name;

    -- Check for isactive/isActive
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'isactive'
    INTO actual_column_name;

    RAISE NOTICE 'Found is active column: %', actual_column_name;
END $$;

-- Now add indexes based on the actual column names
DO $$
DECLARE
    actual_column_name text;
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

    -- Check for assignedTo/assignedto column and add index
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'assignedto'
    INTO actual_column_name;

    IF actual_column_name IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE tablename = 'members'
            AND indexname = 'idx_members_assigned_to'
        ) THEN
            EXECUTE format('CREATE INDEX idx_members_assigned_to ON public.members ("%s")', actual_column_name);
            RAISE NOTICE 'Created index on members.%', actual_column_name;
        ELSE
            RAISE NOTICE 'Index on members.% already exists', actual_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Column assignedto does not exist in members table';
    END IF;

    -- Check for churchUnit/churchunit column and add index
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'churchunit'
    INTO actual_column_name;

    IF actual_column_name IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE tablename = 'members'
            AND indexname = 'idx_members_church_unit'
        ) THEN
            EXECUTE format('CREATE INDEX idx_members_church_unit ON public.members ("%s")', actual_column_name);
            RAISE NOTICE 'Created index on members.%', actual_column_name;
        ELSE
            RAISE NOTICE 'Index on members.% already exists', actual_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Column churchunit does not exist in members table';
    END IF;

    -- Check for fullName/fullname column and add index
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'fullname'
    INTO actual_column_name;

    IF actual_column_name IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE tablename = 'members'
            AND indexname = 'idx_members_full_name'
        ) THEN
            EXECUTE format('CREATE INDEX idx_members_full_name ON public.members ("%s")', actual_column_name);
            RAISE NOTICE 'Created index on members.%', actual_column_name;
        ELSE
            RAISE NOTICE 'Index on members.% already exists', actual_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Column fullname does not exist in members table';
    END IF;

    -- Check if email index exists, if not add it
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

    -- Check for isActive/isactive column and add index
    SELECT information_schema.columns.column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'members'
    AND lower(information_schema.columns.column_name) = 'isactive'
    INTO actual_column_name;

    IF actual_column_name IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE tablename = 'members'
            AND indexname = 'idx_members_is_active'
        ) THEN
            EXECUTE format('CREATE INDEX idx_members_is_active ON public.members ("%s")', actual_column_name);
            RAISE NOTICE 'Created index on members.%', actual_column_name;
        ELSE
            RAISE NOTICE 'Index on members.% already exists', actual_column_name;
        END IF;
    ELSE
        RAISE NOTICE 'Column isactive does not exist in members table';
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
