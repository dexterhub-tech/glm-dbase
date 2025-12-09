-- This file contains SQL to create a trigger that automatically adds new users to the members table
-- Run this in the Supabase SQL editor

-- Function to handle new profile creation and sync to members table
CREATE OR REPLACE FUNCTION public.sync_profile_to_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add error handling with BEGIN/EXCEPTION block
  BEGIN
    -- Check if the user already exists in the members table (case-insensitive comparison)
    IF NOT EXISTS (
      SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(NEW.email)
    ) THEN
      -- Insert the new user into the members table
      INSERT INTO public.members (
        fullname,
        email,
        category,
        churchunit,
        churchunits,
        assignedto,
        phone,
        address,
        isactive,
        joindate,
        userid,
        created_at,
        updated_at
      )
      VALUES (
        COALESCE(NEW.full_name, split_part(NEW.email, '@', 1), 'Unknown'),
        LOWER(NEW.email), -- Ensure email is lowercase
        'Others', -- Default category
        NEW.church_unit,
        CASE WHEN NEW.church_unit IS NOT NULL THEN ARRAY[NEW.church_unit] ELSE NULL END, -- Add as array
        NEW.assigned_pastor,
        NEW.phone,
        NEW.address,
        true, -- isactive
        CURRENT_DATE, -- joindate
        NEW.id, -- userid (links to auth.users)
        now(), -- created_at
        now() -- updated_at
      );
    END IF;
  EXCEPTION
    WHEN others THEN
      -- Log the error (this will appear in Supabase logs)
      RAISE WARNING 'Error in sync_profile_to_members trigger: %', SQLERRM;

      -- Try a simplified insert with just the essential fields
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM public.members WHERE LOWER(email) = LOWER(NEW.email)
        ) THEN
          INSERT INTO public.members (
            fullname,
            email,
            category,
            isactive,
            joindate,
            userid,
            created_at,
            updated_at
          )
          VALUES (
            COALESCE(NEW.full_name, split_part(NEW.email, '@', 1), 'Unknown'),
            LOWER(NEW.email),
            'Others',
            true,
            CURRENT_DATE,
            NEW.id,
            now(),
            now()
          );
        END IF;
      EXCEPTION
        WHEN others THEN
          RAISE WARNING 'Fallback insert also failed: %', SQLERRM;
          -- Continue anyway to avoid blocking profile creation
      END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add new profiles to the members table
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_members();

-- Trigger to update members when profiles are updated
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.phone IS DISTINCT FROM NEW.phone OR
        OLD.address IS DISTINCT FROM NEW.address)
  EXECUTE FUNCTION public.sync_profile_to_members();

-- Function to sync existing profiles to members table
CREATE OR REPLACE FUNCTION public.sync_all_profiles_to_members()
RETURNS TEXT AS $$
DECLARE
  profile_count INTEGER := 0;
  member_count INTEGER := 0;
  synced_count INTEGER := 0;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO member_count FROM public.members;

  -- Insert profiles that don't exist in members table
  WITH profiles_to_sync AS (
    SELECT
      p.id,
      p.email,
      p.full_name,
      p.church_unit,
      p.assigned_pastor,
      p.phone,
      p.address
    FROM
      public.profiles p
    LEFT JOIN
      public.members m ON LOWER(p.email) = LOWER(m.email)
    WHERE
      m.email IS NULL
      AND p.email IS NOT NULL
  )
  INSERT INTO public.members (
    fullname,
    email,
    category,
    churchunit,
    assignedto,
    phone,
    address,
    isactive,
    joindate,
    userid
  )
  SELECT
    pts.full_name,
    pts.email,
    'Others', -- Default category
    pts.church_unit,
    pts.assigned_pastor,
    pts.phone,
    pts.address,
    true, -- isactive
    CURRENT_DATE, -- joindate
    pts.id -- userid
  FROM
    profiles_to_sync pts;

  GET DIAGNOSTICS synced_count = ROW_COUNT;

  RETURN 'Sync complete. Profiles: ' || profile_count || ', Members: ' || member_count || ', Newly synced: ' || synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run this function to sync all existing profiles to members table
-- SELECT public.sync_all_profiles_to_members();
