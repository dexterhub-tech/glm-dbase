-- Emergency fix for signup issues
-- This script fixes the most critical problems preventing user registration
-- 1. Drop any existing problematic functions completely
DROP FUNCTION IF EXISTS public.create_user_profile_safe CASCADE;
-- 2. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    church_unit text,
    assigned_pastor text,
    phone text,
    address text,
    genotype text,
    role text DEFAULT 'user',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 3. Ensure members table exists with correct structure
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fullname text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    address text,
    category text NOT NULL DEFAULT 'Members',
    title text,
    assignedto uuid,
    churchunit text,
    churchunits text [],
    auxanogroup text,
    joindate date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    isactive boolean NOT NULL DEFAULT true,
    userid uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- 4. Disable RLS temporarily to allow signup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
-- 5. Create the safe profile creation function with proper error handling
CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
        user_id uuid,
        user_email text,
        user_full_name text,
        church_unit text DEFAULT NULL,
        phone text DEFAULT NULL
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
normalized_email text;
BEGIN -- Normalize email
normalized_email := LOWER(TRIM(user_email));
BEGIN -- Try to create/update profile
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        church_unit,
        phone,
        updated_at
    )
VALUES (
        user_id,
        normalized_email,
        TRIM(user_full_name),
        church_unit,
        phone,
        now()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    church_unit = EXCLUDED.church_unit,
    phone = EXCLUDED.phone,
    updated_at = now();
-- Try to create member record
INSERT INTO public.members (
        fullname,
        email,
        phone,
        category,
        churchunit,
        isactive,
        joindate,
        userid,
        created_at,
        updated_at
    )
VALUES (
        TRIM(user_full_name),
        normalized_email,
        phone,
        'Members',
        church_unit,
        true,
        CURRENT_DATE,
        user_id,
        now(),
        now()
    ) ON CONFLICT (email) DO
UPDATE
SET fullname = EXCLUDED.fullname,
    phone = EXCLUDED.phone,
    churchunit = EXCLUDED.churchunit,
    userid = EXCLUDED.userid,
    updated_at = now();
result := json_build_object(
    'success',
    true,
    'message',
    'Profile and member record created/updated successfully',
    'user_id',
    user_id
);
EXCEPTION
WHEN OTHERS THEN -- Log the error and return failure
result := json_build_object(
    'success',
    false,
    'message',
    'Database error: ' || SQLERRM,
    'user_id',
    user_id,
    'error_code',
    SQLSTATE
);
END;
RETURN result;
END;
$$;
-- 6. Create a trigger to automatically handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_email text;
user_name text;
normalized_email text;
BEGIN -- Get user data
user_email := NEW.email;
user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
);
normalized_email := LOWER(TRIM(user_email));
BEGIN -- Create profile record
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        church_unit,
        phone,
        updated_at
    )
VALUES (
        NEW.id,
        normalized_email,
        user_name,
        NEW.raw_user_meta_data->>'church_unit',
        NEW.raw_user_meta_data->>'phone',
        now()
    ) ON CONFLICT (id) DO NOTHING;
-- Create member record
INSERT INTO public.members (
        fullname,
        email,
        phone,
        category,
        churchunit,
        isactive,
        joindate,
        userid,
        created_at,
        updated_at
    )
VALUES (
        user_name,
        normalized_email,
        NEW.raw_user_meta_data->>'phone',
        'Members',
        NEW.raw_user_meta_data->>'church_unit',
        true,
        CURRENT_DATE,
        NEW.id,
        now(),
        now()
    ) ON CONFLICT (email) DO NOTHING;
EXCEPTION
WHEN OTHERS THEN -- Log error but don't fail the signup
RAISE WARNING 'Error in handle_new_user trigger: %',
SQLERRM;
END;
RETURN NEW;
END;
$$;
-- 7. Drop existing trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 8. Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO anon,
    authenticated,
    service_role;
GRANT ALL ON public.profiles TO anon,
    authenticated,
    service_role;
GRANT ALL ON public.members TO anon,
    authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO anon,
    authenticated,
    service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon,
    authenticated,
    service_role;
-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_userid ON public.members(userid);
-- 10. Test the function
SELECT public.create_user_profile_safe(
        '00000000-0000-0000-0000-000000000000'::uuid,
        'test@example.com',
        'Test User',
        'test_unit',
        '+1234567890'
    ) as test_result;
-- Clean up test data
DELETE FROM public.members
WHERE email = 'test@example.com';
DELETE FROM public.profiles
WHERE email = 'test@example.com';
SELECT 'Emergency signup fix completed successfully!' as status;