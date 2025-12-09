-- SQL script to fix the userid constraint issue in the members table
-- This is a simplified version that should work more reliably
-- Run this in the Supabase SQL editor

-- Make the userid column nullable (if it's not already)
ALTER TABLE public.members ALTER COLUMN userid DROP NOT NULL;

-- Update the database schema documentation
COMMENT ON COLUMN public.members.userid IS 'Reference to the auth.users table for linking members to authenticated users (nullable)';

-- Let's also add an index on the userid column for better performance
CREATE INDEX IF NOT EXISTS idx_members_userid ON public.members (userid);

-- Add a comment to explain what we did
COMMENT ON TABLE public.members IS 'Stores information about church members, including pastors. The userid column is nullable and references auth.users(id).';
