-- SQL script to add the title column to the members table
-- Run this in the Supabase SQL editor

-- Check if title column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.members ADD COLUMN title text;
        RAISE NOTICE 'Added title column to members table';
    ELSE
        RAISE NOTICE 'title column already exists in members table';
    END IF;
END $$;

-- Update the database schema documentation
COMMENT ON COLUMN public.members.title IS 'Pastor''s title (e.g., Senior Pastor, Youth Pastor)';
