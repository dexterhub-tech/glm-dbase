-- Complete sync function to handle auth users not in profiles/members
-- This will sync users from auth.users to both profiles and members tables
-- Run this in the Supabase SQL editor

-- Function to sync all auth users to profiles and members
CREATE OR REPLACE FUNCTION public.sync_all_auth_users()
RETURNS JSONB AS $$
DECLARE
    auth_user RECORD;
    profile_count INTEGER := 0;
    member_count INTEGER := 0;
    profiles_created INTEGER := 0;
    members_created INTEGER := 0;
    profiles_updated INTEGER := 0;
    members_updated INTEGER := 0;
    total_auth_users INTEGER := 0;
BEGIN
    -- Count total auth users
    SELECT COUNT(*) INTO total_auth_users FROM auth.users WHERE email IS NOT NULL;
    
    -- Loop through all auth users
    FOR auth_user IN 
        SELECT id, email, raw_user_meta_data, created_at
        FROM auth.users 
        WHERE email IS NOT NULL
    LOOP
        -- Check if profile exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth_user.id) THEN
            -- Create profile
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                updated_at
            )
            VALUES (
                auth_user.id,
                LOWER(auth_user.email),
                COALESCE(
                    auth_user.raw_user_meta_data->>'full_name',
                    auth_user.raw_user_meta_data->>'name',
                    split_part(auth_user.email, '@', 1),
                    'Unknown'
                ),
                now()
            );
            profiles_created := profiles_created + 1;
        ELSE
            -- Update profile if needed
            UPDATE public.profiles 
            SET 
                email = LOWER(auth_user.email),
                updated_at = now()
            WHERE id = auth_user.id 
            AND (email != LOWER(auth_user.email));
            
            IF FOUND THEN
                profiles_updated := profiles_updated + 1;
            END IF;
        END IF;
        
        -- Check if member exists
        IF NOT EXISTS (SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(auth_user.email)) THEN
            -- Create member
            INSERT INTO public.members (
                fullname,
                email,
                category,
                isactive,
                joindate,
                user_id,
                userid,
                created_at,
                updated_at
            )
            VALUES (
                COALESCE(
                    auth_user.raw_user_meta_data->>'full_name',
                    auth_user.raw_user_meta_data->>'name',
                    split_part(auth_user.email, '@', 1),
                    'Unknown'
                ),
                LOWER(auth_user.email),
                'Members',
                true,
                COALESCE(auth_user.created_at::date, CURRENT_DATE),
                auth_user.id,
                auth_user.id,
                now(),
                now()
            );
            members_created := members_created + 1;
        ELSE
            -- Update member with user IDs if missing
            UPDATE public.members 
            SET 
                user_id = auth_user.id,
                userid = auth_user.id,
                updated_at = now()
            WHERE LOWER(email) = LOWER(auth_user.email) 
            AND (user_id IS NULL OR userid IS NULL);
            
            IF FOUND THEN
                members_updated := members_updated + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Get final counts
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO member_count FROM public.members;
    
    -- Return comprehensive result
    RETURN jsonb_build_object(
        'success', true,
        'total_auth_users', total_auth_users,
        'total_profiles', profile_count,
        'total_members', member_count,
        'profiles_created', profiles_created,
        'profiles_updated', profiles_updated,
        'members_created', members_created,
        'members_updated', members_updated,
        'message', format(
            'Sync complete. Auth users: %s, Profiles created: %s, Members created: %s, Profiles updated: %s, Members updated: %s',
            total_auth_users, profiles_created, members_created, profiles_updated, members_updated
        )
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Complete sync failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_all_auth_users() TO authenticated;

-- Test query to see current state (run this first to see what's missing)
-- SELECT 
--     (SELECT COUNT(*) FROM auth.users WHERE email IS NOT NULL) as auth_users,
--     (SELECT COUNT(*) FROM public.profiles) as profiles,
--     (SELECT COUNT(*) FROM public.members) as members,
--     (SELECT COUNT(*) FROM public.members WHERE user_id IS NOT NULL) as members_with_user_id;

-- Run the complete sync
-- SELECT public.sync_all_auth_users();