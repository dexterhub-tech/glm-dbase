-- SQL script to add the userid column to the members table
-- Run this in the Supabase SQL editor

-- Check if userid column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'userid'
    ) THEN
        ALTER TABLE public.members ADD COLUMN userid uuid REFERENCES auth.users(id);
        RAISE NOTICE 'Added userid column to members table';
    ELSE
        RAISE NOTICE 'userid column already exists in members table';
    END IF;
END $$;

-- Update the database schema documentation
COMMENT ON COLUMN public.members.userid IS 'Reference to the auth.users table for linking members to authenticated users';
