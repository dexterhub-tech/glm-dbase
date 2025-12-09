# Database Trigger Update Instructions

This document provides instructions for updating the database triggers to fix user registration issues.

## Background

There have been issues with new user registration, particularly:
1. "Failed to fetch" errors
2. "Database error saving new user" errors

These issues are related to the database triggers that handle profile creation and synchronization to the members table.

## Required Updates

Two database triggers need to be updated:

1. `handle_new_user` - Creates a profile when a new user signs up
2. `sync_profile_to_members` - Adds a new profile to the members table

## How to Update the Triggers

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the updated trigger functions below
6. Click "Run" to execute the query

### Updated `handle_new_user` Trigger

```sql
-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Add error handling with BEGIN/EXCEPTION block
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      church_unit,
      assigned_pastor,
      phone,
      genotype,
      address,
      updated_at
    )
    VALUES (
      new.id,
      LOWER(new.email), -- Ensure email is lowercase
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'church_unit',
      new.raw_user_meta_data->>'assigned_pastor',
      new.raw_user_meta_data->>'phone',
      new.raw_user_meta_data->>'genotype',
      new.raw_user_meta_data->>'address',
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = LOWER(EXCLUDED.email), -- Ensure email is lowercase
      full_name = EXCLUDED.full_name,
      church_unit = EXCLUDED.church_unit,
      assigned_pastor = EXCLUDED.assigned_pastor,
      phone = EXCLUDED.phone,
      genotype = EXCLUDED.genotype,
      address = EXCLUDED.address,
      updated_at = now();
  EXCEPTION
    WHEN others THEN
      -- Log the error (this will appear in Supabase logs)
      RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;

      -- Try a simplified insert with just the essential fields
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          updated_at
        )
        VALUES (
          new.id,
          LOWER(new.email),
          now()
        )
        ON CONFLICT (id) DO NOTHING;
      EXCEPTION
        WHEN others THEN
          RAISE WARNING 'Fallback insert also failed: %', SQLERRM;
          -- Continue anyway to avoid blocking user creation
      END;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Updated `sync_profile_to_members` Trigger

```sql
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
```

## Verification

After updating the triggers, you should:

1. Test creating a new user account
2. Verify that the profile is created in the profiles table
3. Verify that the member is added to the members table

## Troubleshooting

If you continue to experience issues:

1. Check the Supabase logs for any errors
2. Verify that the triggers are properly installed
3. Ensure that the profiles and members tables have the required columns
