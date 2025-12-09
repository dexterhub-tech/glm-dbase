-- SQL script to standardize fields in the members table
-- This will ensure consistency between churchUnit, churchunit, churchUnits, and churchunits

-- First, ensure all tables have the necessary columns
DO $$
BEGIN
    -- Check if churchUnits column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchUnits'
    ) THEN
        ALTER TABLE public.members ADD COLUMN "churchUnits" text[];
        RAISE NOTICE 'Added churchUnits column to members table';
    ELSE
        RAISE NOTICE 'churchUnits column already exists in members table';
    END IF;

    -- Check if churchunits column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunits'
    ) THEN
        ALTER TABLE public.members ADD COLUMN churchunits text[];
        RAISE NOTICE 'Added churchunits column to members table';
    ELSE
        RAISE NOTICE 'churchunits column already exists in members table';
    END IF;

    -- Check if churchUnit column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchUnit'
    ) THEN
        ALTER TABLE public.members ADD COLUMN "churchUnit" text;
        RAISE NOTICE 'Added churchUnit column to members table';
    ELSE
        RAISE NOTICE 'churchUnit column already exists in members table';
    END IF;

    -- Check if churchunit column exists, if not add it
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunit'
    ) THEN
        ALTER TABLE public.members ADD COLUMN churchunit text;
        RAISE NOTICE 'Added churchunit column to members table';
    ELSE
        RAISE NOTICE 'churchunit column already exists in members table';
    END IF;
END $$;

-- Now standardize the data
DO $$
BEGIN
    -- Update churchUnits from churchUnit if churchUnits is null but churchUnit is not
    UPDATE public.members
    SET "churchUnits" = ARRAY["churchUnit"]
    WHERE "churchUnit" IS NOT NULL 
    AND ("churchUnits" IS NULL OR array_length("churchUnits", 1) IS NULL);
    
    RAISE NOTICE 'Updated churchUnits from churchUnit';

    -- Update churchunits from churchunit if churchunits is null but churchunit is not
    UPDATE public.members
    SET churchunits = ARRAY[churchunit]
    WHERE churchunit IS NOT NULL 
    AND (churchunits IS NULL OR array_length(churchunits, 1) IS NULL);
    
    RAISE NOTICE 'Updated churchunits from churchunit';

    -- Sync churchUnits and churchunits
    UPDATE public.members
    SET churchunits = "churchUnits"
    WHERE "churchUnits" IS NOT NULL 
    AND (churchunits IS NULL OR array_length(churchunits, 1) IS NULL);
    
    UPDATE public.members
    SET "churchUnits" = churchunits
    WHERE churchunits IS NOT NULL 
    AND ("churchUnits" IS NULL OR array_length("churchUnits", 1) IS NULL);
    
    RAISE NOTICE 'Synced churchUnits and churchunits';

    -- Update churchUnit from churchUnits if churchUnit is null but churchUnits has values
    UPDATE public.members
    SET "churchUnit" = "churchUnits"[1]
    WHERE "churchUnits" IS NOT NULL 
    AND array_length("churchUnits", 1) > 0
    AND "churchUnit" IS NULL;
    
    RAISE NOTICE 'Updated churchUnit from churchUnits';

    -- Update churchunit from churchunits if churchunit is null but churchunits has values
    UPDATE public.members
    SET churchunit = churchunits[1]
    WHERE churchunits IS NOT NULL 
    AND array_length(churchunits, 1) > 0
    AND churchunit IS NULL;
    
    RAISE NOTICE 'Updated churchunit from churchunits';

    -- Sync churchUnit and churchunit
    UPDATE public.members
    SET churchunit = "churchUnit"
    WHERE "churchUnit" IS NOT NULL AND churchunit IS NULL;
    
    UPDATE public.members
    SET "churchUnit" = churchunit
    WHERE churchunit IS NOT NULL AND "churchUnit" IS NULL;
    
    RAISE NOTICE 'Synced churchUnit and churchunit';
END $$;

-- Verify the results
SELECT 
    id, 
    "churchUnit", 
    churchunit, 
    "churchUnits", 
    churchunits
FROM 
    public.members
WHERE 
    "churchUnit" IS NOT NULL OR 
    churchunit IS NOT NULL OR 
    "churchUnits" IS NOT NULL OR 
    churchunits IS NOT NULL
LIMIT 10;
