-- Function to create the check_trigger_exists function
-- This function is used to check if a trigger exists
CREATE OR REPLACE FUNCTION public.create_trigger_check_function()
RETURNS VOID AS $$
BEGIN
  -- Check if the function already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'check_trigger_exists'
  ) THEN
    -- Create the function to check if a trigger exists
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.check_trigger_exists(
        trigger_name TEXT,
        table_name TEXT,
        schema_name TEXT DEFAULT ''public''
      )
      RETURNS BOOLEAN AS $$
      DECLARE
        trigger_exists BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = trigger_name
          AND c.relname = table_name
          AND n.nspname = schema_name
        ) INTO trigger_exists;
        
        RETURN trigger_exists;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
    
    RAISE NOTICE 'check_trigger_exists function created successfully';
  ELSE
    RAISE NOTICE 'check_trigger_exists function already exists';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the check_trigger_exists function
-- SELECT public.create_trigger_check_function();

-- Example usage:
-- SELECT public.check_trigger_exists('on_auth_user_created', 'users', 'auth');
-- SELECT public.check_trigger_exists('on_profile_created', 'profiles', 'public');
