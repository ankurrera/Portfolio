-- Extend photo_category enum to include 'artistic' category
-- This supports the new Artistic admin page with the same upload/editor template

-- First, check if the type exists and add the new value
DO $$ 
BEGIN
  -- Add 'artistic' to the photo_category enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'artistic' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'photo_category')
  ) THEN
    ALTER TYPE photo_category ADD VALUE 'artistic';
  END IF;
END $$;

-- Add comment
COMMENT ON TYPE photo_category IS 'Photo category: selected, commissioned, editorial, personal, artistic';
