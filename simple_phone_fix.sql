-- Simple phone validation fix for Nigerian numbers
-- Run this in your Supabase SQL Editor

-- Remove existing phone constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_phone;
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS valid_phone;

-- Add new phone constraint that allows Nigerian numbers starting with 0
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone 
CHECK (phone IS NULL OR phone = '' OR phone ~* '^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$');

-- Add same constraint to members table  
ALTER TABLE public.members 
ADD CONSTRAINT valid_phone 
CHECK (phone IS NULL OR phone = '' OR phone ~* '^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$');