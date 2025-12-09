-- This file contains SQL triggers for Supabase
-- You can run these in the Supabase SQL editor to set up automatic profile creation

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the profiles table has all required columns
  -- If not, you'll need to add them with:
  -- ALTER TABLE public.profiles ADD COLUMN church_unit text;
  -- ALTER TABLE public.profiles ADD COLUMN assigned_pastor text;
  -- ALTER TABLE public.profiles ADD COLUMN phone text;
  -- ALTER TABLE public.profiles ADD COLUMN genotype text;
  -- ALTER TABLE public.profiles ADD COLUMN address text;

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
