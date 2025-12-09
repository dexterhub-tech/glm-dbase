-- Optional: Add admin columns to profiles table for proper role management
-- Run this ONLY if you want to add admin role management to your profiles table

-- Check if columns already exist and add them if they don't
DO $$
BEGIN
    -- Add is_admin column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;

    -- Add is_superuser column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_superuser'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_superuser BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Set specific users as admin/superuser (replace with your actual admin emails)
UPDATE public.profiles 
SET is_admin = true, is_superuser = true 
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('ojidelawrence@gmail.com', 'admin@gospellabourministry.com')
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_superuser ON public.profiles(is_superuser);

SELECT 'Admin columns added to profiles table successfully' as result;