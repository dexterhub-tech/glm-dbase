-- SQL script to standardize fields in the members table
-- This will ensure consistency between churchUnit, churchunit, churchUnits, and churchunits
-- This improved version is more robust and handles column name case sensitivity

-- First, check which columns actually exist
DO $$
DECLARE
    has_church_units boolean := false;
    has_church_units_lower boolean := false;
    has_church_unit boolean := false;
    has_church_unit_lower boolean := false;
BEGIN
    -- Check for churchUnits column
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchUnits'
    ) INTO has_church_units;
    
    -- Check for churchunits column
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunits'
    ) INTO has_church_units_lower;
    
    -- Check for churchUnit column
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchUnit'
    ) INTO has_church_unit;
    
    -- Check for churchunit column
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'churchunit'
    ) INTO has_church_unit_lower;
    
    -- Log the findings
    RAISE NOTICE 'Column check results:';
    RAISE NOTICE 'churchUnits: %', has_church_units;
    RAISE NOTICE 'churchunits: %', has_church_units_lower;
    RAISE NOTICE 'churchUnit: %', has_church_unit;
    RAISE NOTICE 'churchunit: %', has_church_unit_lower;
    
    -- Add missing columns
    IF NOT has_church_units THEN
        ALTER TABLE public.members ADD COLUMN "churchUnits" text[];
        RAISE NOTICE 'Added churchUnits column to members table';
    END IF;
    
    IF NOT has_church_units_lower THEN
        ALTER TABLE public.members ADD COLUMN churchunits text[];
        RAISE NOTICE 'Added churchunits column to members table';
    END IF;
    
    IF NOT has_church_unit THEN
        ALTER TABLE public.members ADD COLUMN "churchUnit" text;
        RAISE NOTICE 'Added churchUnit column to members table';
    END IF;
    
    IF NOT has_church_unit_lower THEN
        ALTER TABLE public.members ADD COLUMN churchunit text;
        RAISE NOTICE 'Added churchunit column to members table';
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
    
    -- Also standardize other fields that might have case inconsistencies
    
    -- Check for assignedTo/assignedto
    BEGIN
        UPDATE public.members
        SET "assignedTo" = assignedto
        WHERE assignedto IS NOT NULL AND "assignedTo" IS NULL;
        
        UPDATE public.members
        SET assignedto = "assignedTo"
        WHERE "assignedTo" IS NOT NULL AND assignedto IS NULL;
        
        RAISE NOTICE 'Synced assignedTo and assignedto';
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'One of assignedTo/assignedto columns does not exist';
    END;
    
    -- Check for fullName/fullname
    BEGIN
        UPDATE public.members
        SET "fullName" = fullname
        WHERE fullname IS NOT NULL AND "fullName" IS NULL;
        
        UPDATE public.members
        SET fullname = "fullName"
        WHERE "fullName" IS NOT NULL AND fullname IS NULL;
        
        RAISE NOTICE 'Synced fullName and fullname';
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'One of fullName/fullname columns does not exist';
    END;
    
    -- Check for isActive/isactive
    BEGIN
        UPDATE public.members
        SET "isActive" = isactive
        WHERE isactive IS NOT NULL AND "isActive" IS NULL;
        
        UPDATE public.members
        SET isactive = "isActive"
        WHERE "isActive" IS NOT NULL AND isactive IS NULL;
        
        RAISE NOTICE 'Synced isActive and isactive';
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'One of isActive/isactive columns does not exist';
    END;
    
    -- Check for auxanoGroup/auxanogroup
    BEGIN
        UPDATE public.members
        SET "auxanoGroup" = auxanogroup
        WHERE auxanogroup IS NOT NULL AND "auxanoGroup" IS NULL;
        
        UPDATE public.members
        SET auxanogroup = "auxanoGroup"
        WHERE "auxanoGroup" IS NOT NULL AND auxanogroup IS NULL;
        
        RAISE NOTICE 'Synced auxanoGroup and auxanogroup';
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'One of auxanoGroup/auxanogroup columns does not exist';
    END;
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
