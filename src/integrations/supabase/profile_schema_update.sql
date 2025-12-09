-- Schema updates for the profiles table to add phone, genotype, and address fields
-- Run this in the Supabase SQL editor

-- Check if phone column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END $$;

-- Check if genotype column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'genotype'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN genotype text;
    END IF;
END $$;

-- Check if address column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address text;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
