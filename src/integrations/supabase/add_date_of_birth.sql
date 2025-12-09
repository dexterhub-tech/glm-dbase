-- Schema update to add date_of_birth column to the profiles table
-- Run this in the Supabase SQL Editor

-- Check if date_of_birth column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
        RAISE NOTICE 'Added date_of_birth column to profiles table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in profiles table';
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
