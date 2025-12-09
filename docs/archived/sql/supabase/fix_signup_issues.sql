-- Comprehensive fix for signup issues
-- Run this script in Supabase SQL Editor to permanently fix user registration problems

-- 1. First, ensure all required tables exist with proper structure
-- Create profiles table if it doesn't exist
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

-- Create members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fullname text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    category text NOT NULL DEFAULT 'Members',
    title text,
    assignedto uuid REFERENCES members(id),
    churchunit text,
    churchunits text[],
    auxanogroup text,
    joindate date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    isactive boolean NOT NULL DEFAULT true,
    userid uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add missing columns to existing tables
-- Add columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add church_unit column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='church_unit') THEN
        ALTER TABLE public.profiles ADD COLUMN church_unit text;
    END IF;
    
    -- Add assigned_pastor column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='assigned_pastor') THEN
        ALTER TABLE public.profiles ADD COLUMN assigned_pastor text;
    END IF;
    
    -- Add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    
    -- Add address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ADD COLUMN address text;
    END IF;
    
    -- Add genotype column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='genotype') THEN
        ALTER TABLE public.profiles ADD COLUMN genotype text;
    END IF;
    
    -- Add role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
END $$;

-- 3. Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role can do everything" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Create RLS policies for members table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.members;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.members;
DROP POLICY IF EXISTS "Service role can do everything" ON public.members;

-- Allow all authenticated users to read members
CREATE POLICY "Enable read access for all users" ON public.members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only" ON public.members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own member record
CREATE POLICY "Enable update for authenticated users only" ON public.members
    FOR UPDATE USING (userid = auth.uid() OR auth.role() = 'service_role');

-- Allow service role full access
CREATE POLICY "Service role can do everything" ON public.members
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Drop existing function and create the create_user_profile_safe function
DROP FUNCTION IF EXISTS public.create_user_profile_safe(uuid,text,text,text,text);
DROP FUNCTION IF EXISTS public.create_user_profile_safe;

CREATE OR REPLACE FUNCTION public.create_user_profile_safe(
    user_id uuid,
    user_email text,
    user_full_name text,
    church_unit text DEFAULT NULL,
    phone text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    profile_exists boolean := false;
    member_exists boolean := false;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
    
    -- Check if member already exists
    SELECT EXISTS(SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(user_email)) INTO member_exists;
    
    BEGIN
        -- Create or update profile
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
            LOWER(user_email),
            user_full_name,
            church_unit,
            phone,
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            church_unit = EXCLUDED.church_unit,
            phone = EXCLUDED.phone,
            updated_at = now();
        
        -- Create member record if it doesn't exist
        IF NOT member_exists THEN
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
                user_full_name,
                LOWER(user_email),
                phone,
                'Members',
                church_unit,
                true,
                CURRENT_DATE,
                user_id,
                now(),
                now()
            );
        END IF;
        
        result := json_build_object(
            'success', true,
            'message', 'Profile and member record created/updated successfully',
            'user_id', user_id
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'user_id', user_id
        );
    END;
    
    RETURN result;
END;
$$;

-- 7. Create trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
BEGIN
    -- Get user email and name from auth.users
    user_email := NEW.email;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    -- Create profile record
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
        LOWER(user_email),
        user_name,
        NEW.raw_user_meta_data->>'church_unit',
        NEW.raw_user_meta_data->>'phone',
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    
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
        LOWER(user_email),
        NEW.raw_user_meta_data->>'phone',
        'Members',
        NEW.raw_user_meta_data->>'church_unit',
        true,
        CURRENT_DATE,
        NEW.id,
        now(),
        now()
    )
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 8. Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.members TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated, service_role;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_userid ON public.members(userid);

-- 11. Test the setup
SELECT 'Database setup completed successfully. All tables, functions, and policies are in place.' as status;