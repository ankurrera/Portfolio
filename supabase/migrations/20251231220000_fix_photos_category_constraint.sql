-- Fix photos table category column constraint issue
-- This migration ensures backward compatibility by handling the category column
-- whether it exists or has been removed by previous migrations

-- Check if category column exists and make it nullable with default value
DO $$ 
BEGIN
  -- If category column exists, modify its constraints
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'category'
  ) THEN
    -- First, try to drop the NOT NULL constraint if it exists
    BEGIN
      ALTER TABLE public.photos 
      ALTER COLUMN category DROP NOT NULL;
      
      RAISE NOTICE 'Dropped NOT NULL constraint from photos.category';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Category column NOT NULL constraint already dropped or does not exist';
    END;
    
    -- Set a default value for the category column
    BEGIN
      ALTER TABLE public.photos 
      ALTER COLUMN category SET DEFAULT 'photoshoot'::text::photo_category;
      
      RAISE NOTICE 'Set default value for photos.category to photoshoot';
    EXCEPTION
      WHEN OTHERS THEN
        -- If photo_category enum type doesn't exist or other error, just skip
        RAISE NOTICE 'Could not set default value for category: %', SQLERRM;
    END;
    
    -- Update any existing NULL values to 'photoshoot'
    BEGIN
      UPDATE public.photos 
      SET category = 'photoshoot'::text::photo_category
      WHERE category IS NULL;
      
      RAISE NOTICE 'Updated NULL category values to photoshoot';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not update NULL categories: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Category column does not exist in photos table - no action needed';
  END IF;
END $$;

-- Add comment to document this fix
COMMENT ON TABLE public.photos IS 'Photos table for photoshoot gallery. Category column is optional/nullable if present for backward compatibility.';
