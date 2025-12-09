-- Schema updates for the profiles table
-- Run this in the Supabase SQL editor to add the missing columns

-- Check if church_unit column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'church_unit'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN church_unit text;
    END IF;
END $$;

-- Check if assigned_pastor column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'assigned_pastor'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN assigned_pastor text;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
