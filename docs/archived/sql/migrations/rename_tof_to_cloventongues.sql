-- SQL script to rename "tof" to "cloventongues" in the members table
-- Run this in the Supabase SQL editor

-- First, check which columns actually exist in the database
DO $$
DECLARE
    has_churchunit BOOLEAN;
    has_churchunits BOOLEAN;
BEGIN
    -- Check if churchunit column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunit'
    ) INTO has_churchunit;

    -- Check if churchunits column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunits'
    ) INTO has_churchunits;

    -- Log which columns exist
    RAISE NOTICE 'churchunit column exists: %', has_churchunit;
    RAISE NOTICE 'churchunits column exists: %', has_churchunits;
END $$;

-- Update the churchunit column (single church unit)
UPDATE public.members
SET churchunit = 'cloventongues'
WHERE churchunit = 'tof';

-- Update the churchunits array column (multiple church units)
UPDATE public.members
SET churchunits = array_replace(churchunits, 'tof', 'cloventongues')
WHERE churchunits IS NOT NULL AND 'tof' = ANY(churchunits);

-- Update the church_unit column in the profiles table
UPDATE public.profiles
SET church_unit = 'cloventongues'
WHERE church_unit = 'tof';

-- Log the changes
DO $$
DECLARE
    churchunit_count INT;
    churchunits_count INT;
    profiles_count INT;
BEGIN
    -- Update churchunit column
    UPDATE public.members
    SET churchunit = 'cloventongues'
    WHERE churchunit = 'tof';
    GET DIAGNOSTICS churchunit_count = ROW_COUNT;

    -- Update churchunits array
    UPDATE public.members
    SET churchunits = array_replace(churchunits, 'tof', 'cloventongues')
    WHERE churchunits IS NOT NULL AND 'tof' = ANY(churchunits);
    GET DIAGNOSTICS churchunits_count = ROW_COUNT;

    -- Update profiles table
    UPDATE public.profiles
    SET church_unit = 'cloventongues'
    WHERE church_unit = 'tof';
    GET DIAGNOSTICS profiles_count = ROW_COUNT;

    -- Log the results
    RAISE NOTICE 'Updated % records in churchunit column', churchunit_count;
    RAISE NOTICE 'Updated % records in churchunits array', churchunits_count;
    RAISE NOTICE 'Updated % records in profiles.church_unit column', profiles_count;
END $$;
