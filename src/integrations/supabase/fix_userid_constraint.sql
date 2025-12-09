-- SQL script to fix the userid constraint issue in the members table
-- Run this in the Supabase SQL editor

-- First, check if the userid column exists and has the correct constraint
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if the foreign key constraint exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = 'members'
        AND ccu.column_name = 'userid'
    ) INTO constraint_exists;

    -- If the constraint exists, check if it has ON DELETE SET NULL
    IF constraint_exists THEN
        -- Get the constraint name and check if it has ON DELETE SET NULL
        DECLARE
            constraint_name text;
            has_on_delete_set_null boolean;
        BEGIN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = 'members'
            AND ccu.column_name = 'userid'
            INTO constraint_name;

            -- Check if the constraint has ON DELETE SET NULL
            -- This is a bit tricky in PostgreSQL, so we'll use a workaround
            -- We'll try to drop and recreate the constraint
            BEGIN
                -- Drop the constraint
                EXECUTE format('ALTER TABLE public.members DROP CONSTRAINT %I', constraint_name);
                RAISE NOTICE 'Dropped constraint %', constraint_name;

                -- Recreate the constraint with ON DELETE SET NULL
                ALTER TABLE public.members
                ADD CONSTRAINT members_userid_fkey
                FOREIGN KEY (userid)
                REFERENCES auth.users(id)
                ON DELETE SET NULL;

                RAISE NOTICE 'Recreated constraint with ON DELETE SET NULL';
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Constraint already exists with the same name';
                WHEN others THEN
                    RAISE NOTICE 'Error modifying constraint: %', SQLERRM;
            END;
        END;
    ELSE
        -- Create the constraint with ON DELETE SET NULL
        BEGIN
            ALTER TABLE public.members
            ADD CONSTRAINT members_userid_fkey
            FOREIGN KEY (userid)
            REFERENCES auth.users(id)
            ON DELETE SET NULL;

            RAISE NOTICE 'Added foreign key constraint with ON DELETE SET NULL';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Constraint already exists with the same name';
            WHEN others THEN
                RAISE NOTICE 'Error creating constraint: %', SQLERRM;
        END;
    END IF;

    RAISE NOTICE 'Added foreign key constraint with ON DELETE SET NULL';
END $$;

-- Make the userid column nullable (if it's not already)
DO $$
BEGIN
    -- Check if the userid column is nullable
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'userid'
        AND is_nullable = 'NO'
    ) THEN
        -- Make the column nullable
        ALTER TABLE public.members ALTER COLUMN userid DROP NOT NULL;
        RAISE NOTICE 'Made userid column nullable';
    ELSE
        RAISE NOTICE 'userid column is already nullable';
    END IF;
END $$;

-- Update the database schema documentation
COMMENT ON COLUMN public.members.userid IS 'Reference to the auth.users table for linking members to authenticated users (nullable)';
