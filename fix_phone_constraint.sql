-- Fix phone validation constraint to allow Nigerian phone numbers
-- This script updates the valid_phone constraint to accept phone numbers starting with 0

-- Drop existing constraints if they exist
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_phone;
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS valid_phone;

-- Add new constraint to profiles table that allows:
-- - Nigerian numbers starting with 0 (like 07031098097, 08012345678)
-- - International numbers with + prefix (+2347031098097)
-- - Numbers starting with 1-9 for other countries
-- - NULL values (phone is optional)
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone 
CHECK (
  phone IS NULL OR 
  phone = '' OR
  phone ~* '^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$'
);

-- Add the same constraint to members table
ALTER TABLE public.members 
ADD CONSTRAINT valid_phone 
CHECK (
  phone IS NULL OR 
  phone = '' OR
  phone ~* '^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$'
);

-- Test the constraint with common Nigerian phone number formats
-- These should all be valid now:
-- '07031098097' (MTN)
-- '08012345678' (Airtel)
-- '09012345678' (9mobile)
-- '+2347031098097' (International format)
-- '+1234567890' (Other international)