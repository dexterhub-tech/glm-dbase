-- Emergency fix for signup issues - Run this in Supabase SQL Editor

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    church_unit text,
    phone text,
    role text DEFAULT 'user',
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create members table if it doesn't exist  
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fullname text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    category text NOT NULL DEFAULT 'Members',
    churchunit text,
    isactive boolean NOT NULL DEFAULT true,
    joindate date NOT NULL DEFAULT CURRENT_DATE,
    userid uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Disable RLS temporarily to allow signup
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- 4. Create trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
    user_name text;
BEGIN
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
    ON CONFLICT (email) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.members TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO anon, authenticated, service_role;

SELECT 'Emergency signup fix completed successfully!' as status;
