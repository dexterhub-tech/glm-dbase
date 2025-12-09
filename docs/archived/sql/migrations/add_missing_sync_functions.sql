-- Add missing sync functions for ProfileSyncManager
-- Run this in the Supabase SQL editor

-- Create a wrapper function for sync_all_profiles (calls the existing function)
CREATE OR REPLACE FUNCTION public.sync_all_profiles()
RETURNS JSONB AS $$
DECLARE
    result_text TEXT;
    profile_count INTEGER := 0;
    member_count INTEGER := 0;
    synced_count INTEGER := 0;
BEGIN
    -- Call the existing sync function
    SELECT public.sync_all_profiles_to_members() INTO result_text;
    
    -- Get current counts
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    SELECT COUNT(*) INTO member_count FROM public.members;
    
    -- Extract synced count from result text (basic parsing)
    synced_count := COALESCE(
        CAST(
            SUBSTRING(result_text FROM 'Newly synced: (\d+)')
            AS INTEGER
        ), 0
    );
    
    -- Return structured result
    RETURN jsonb_build_object(
        'success', true,
        'synced_count', synced_count,
        'error_count', 0,
        'total_profiles', profile_count,
        'total_members', member_count,
        'synced_members', member_count,
        'message', result_text
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Sync failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create check_profile_sync_status function
CREATE OR REPLACE FUNCTION public.check_profile_sync_status()
RETURNS JSONB AS $$
DECLARE
    total_profiles INTEGER := 0;
    total_members INTEGER := 0;
    synced_members INTEGER := 0;
    active_members INTEGER := 0;
    profiles_missing INTEGER := 0;
    members_missing INTEGER := 0;
    userid_missing INTEGER := 0;
    total_issues INTEGER := 0;
    is_fully_synced BOOLEAN := false;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO total_members FROM public.members;
    SELECT COUNT(*) INTO active_members FROM public.members WHERE isactive = true;
    
    -- Count synced members (those with user_id or userid)
    SELECT COUNT(*) INTO synced_members 
    FROM public.members 
    WHERE user_id IS NOT NULL OR userid IS NOT NULL;
    
    -- Calculate issues
    profiles_missing := GREATEST(0, total_members - total_profiles);
    members_missing := GREATEST(0, total_profiles - total_members);
    userid_missing := total_members - synced_members;
    total_issues := profiles_missing + members_missing + userid_missing;
    is_fully_synced := (total_issues = 0);
    
    -- Return structured result
    RETURN jsonb_build_object(
        'total_profiles', total_profiles,
        'total_members', total_members,
        'synced_members', synced_members,
        'active_members', active_members,
        'issues', jsonb_build_object(
            'profiles_missing', profiles_missing,
            'members_missing', members_missing,
            'userid_missing', userid_missing,
            'userid_mismatch', 0,
            'total_issues', total_issues
        ),
        'is_fully_synced', is_fully_synced
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'total_profiles', 0,
            'total_members', 0,
            'synced_members', 0,
            'active_members', 0,
            'issues', jsonb_build_object(
                'profiles_missing', 0,
                'members_missing', 0,
                'userid_missing', 0,
                'userid_mismatch', 0,
                'total_issues', 0
            ),
            'is_fully_synced', false
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sync_user_profile function
CREATE OR REPLACE FUNCTION public.sync_user_profile(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
    profile_record RECORD;
    member_record RECORD;
    action_taken TEXT := '';
BEGIN
    user_email := LOWER(TRIM(user_email));
    
    -- Check if profile exists
    SELECT * INTO profile_record FROM public.profiles WHERE LOWER(email) = user_email;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'email', user_email,
            'message', 'Profile not found for this email'
        );
    END IF;
    
    -- Check if member exists
    SELECT * INTO member_record FROM public.members WHERE LOWER(email) = user_email;
    
    IF NOT FOUND THEN
        -- Create member record
        INSERT INTO public.members (
            fullname,
            email,
            category,
            churchunit,
            phone,
            address,
            isactive,
            joindate,
            user_id,
            userid,
            created_at,
            updated_at
        )
        VALUES (
            COALESCE(profile_record.full_name, split_part(user_email, '@', 1), 'Unknown'),
            user_email,
            'Members',
            profile_record.church_unit,
            profile_record.phone,
            profile_record.address,
            true,
            CURRENT_DATE,
            profile_record.id,
            profile_record.id,
            now(),
            now()
        );
        action_taken := 'Created member record';
    ELSE
        -- Update member with user ID if missing
        IF member_record.user_id IS NULL OR member_record.userid IS NULL THEN
            UPDATE public.members 
            SET 
                user_id = profile_record.id,
                userid = profile_record.id,
                updated_at = now()
            WHERE LOWER(email) = user_email;
            action_taken := 'Linked user ID';
        ELSE
            action_taken := 'Already synced';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', action_taken,
        'email', user_email,
        'message', 'User profile sync completed'
    );
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object(
            'success', false,
            'action', 'error',
            'email', user_email,
            'message', 'Sync failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_all_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_profile_sync_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT) TO authenticated;