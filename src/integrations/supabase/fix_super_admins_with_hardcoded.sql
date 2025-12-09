-- This script fixes the super admin display issue by including hardcoded super admins
-- Run this directly in the Supabase SQL Editor

-- 1. Check and add 'superuser' to the app_role enum if needed
DO $$
BEGIN
    -- Check if 'superuser' exists in the app_role enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'app_role'
        AND pg_enum.enumlabel = 'superuser'
    ) THEN
        -- Add 'superuser' to the app_role enum
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superuser';
        RAISE NOTICE 'Added ''superuser'' to app_role enum';
    ELSE
        RAISE NOTICE 'The ''superuser'' value already exists in the app_role enum';
    END IF;
END $$;

-- 2. Create a function to get hardcoded super admin emails
CREATE OR REPLACE FUNCTION public.get_hardcoded_super_admin_emails()
RETURNS TEXT[] AS $$
BEGIN
    -- Return the hardcoded super admin emails
    -- These should match the emails in src/utils/superuser-fix.js
    RETURN ARRAY[
        'ojidelawrence@gmail.com',
        'clickcom007@yahoo.com'
        -- Add other hardcoded super admin emails here
    ];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the list_super_admins function to include hardcoded super admins
DROP FUNCTION IF EXISTS public.list_super_admins();

CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    hardcoded_emails TEXT[];
    combined_result JSONB;
BEGIN
    -- Get super admins from the database
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'user_id', u.id,
                    'email', u.email,
                    'full_name', p.full_name,
                    'created_at', r.created_at,
                    'source', 'database'
                )
            ),
            '[]'::jsonb
        ) INTO result
    FROM 
        public.user_roles r
    JOIN 
        auth.users u ON r.user_id = u.id
    LEFT JOIN 
        public.profiles p ON u.id = p.id
    WHERE 
        r.role = 'superuser'
    ORDER BY 
        r.created_at DESC;
    
    -- Get hardcoded super admin emails
    hardcoded_emails := public.get_hardcoded_super_admin_emails();
    
    -- For each hardcoded email, check if it exists in auth.users
    -- and add it to the result if it's not already included
    FOR i IN 1..array_length(hardcoded_emails, 1) LOOP
        -- Check if this email is already in the result
        IF NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(result) AS elem
            WHERE elem->>'email' = hardcoded_emails[i]
        ) THEN
            -- Look up the user in auth.users
            DECLARE
                user_id UUID;
                user_email TEXT;
                user_full_name TEXT;
                user_created_at TIMESTAMPTZ;
            BEGIN
                -- Find the user in auth.users
                SELECT 
                    u.id, 
                    u.email, 
                    p.full_name, 
                    u.created_at
                INTO 
                    user_id, 
                    user_email, 
                    user_full_name, 
                    user_created_at
                FROM 
                    auth.users u
                LEFT JOIN 
                    public.profiles p ON u.id = p.id
                WHERE 
                    u.email = hardcoded_emails[i]
                LIMIT 1;
                
                -- If user found, add to result
                IF user_id IS NOT NULL THEN
                    result := result || jsonb_build_array(
                        jsonb_build_object(
                            'user_id', user_id,
                            'email', user_email,
                            'full_name', user_full_name,
                            'created_at', user_created_at,
                            'source', 'hardcoded'
                        )
                    );
                END IF;
            END;
        END IF;
    END LOOP;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in list_super_admins: %', SQLERRM;
        RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Test the function
SELECT public.list_super_admins();
