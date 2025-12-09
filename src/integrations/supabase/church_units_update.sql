-- Schema updates for the members table to support multiple church units
-- Run this in the Supabase SQL editor

-- First, check if the churchUnits column exists, if not add it
DO $$
BEGIN
    -- Check the actual column name case in the database
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunit'
    ) THEN
        -- Column exists as 'churchunit' (lowercase)
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'members'
            AND column_name = 'churchunits'
        ) THEN
            -- Add the churchunits column as a text array
            ALTER TABLE public.members ADD COLUMN churchunits text[];

            -- Migrate existing data: copy churchunit values to churchunits array
            UPDATE public.members
            SET churchunits = ARRAY[churchunit]
            WHERE churchunit IS NOT NULL;
        END IF;
    ELSE
        -- Check if column exists as 'churchUnit' (camelCase)
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'members'
            AND column_name = 'churchUnit'
        ) THEN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'members'
                AND column_name = 'churchUnits'
            ) THEN
                -- Add the churchUnits column as a text array
                ALTER TABLE public.members ADD COLUMN "churchUnits" text[];

                -- Migrate existing data: copy churchUnit values to churchUnits array
                UPDATE public.members
                SET "churchUnits" = ARRAY["churchUnit"]
                WHERE "churchUnit" IS NOT NULL;
            END IF;
        ELSE
            -- Neither column exists, just add the new column
            ALTER TABLE public.members ADD COLUMN churchunits text[];
        END IF;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'members'
ORDER BY ordinal_position;
