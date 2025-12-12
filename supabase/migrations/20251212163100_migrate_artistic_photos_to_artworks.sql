-- Migration script to copy existing artistic photos from photos table to artworks table
-- This is a one-time migration that preserves existing data
-- DO NOT delete from photos table automatically - manual verification required

-- Create a function to migrate artistic photos to artworks
CREATE OR REPLACE FUNCTION migrate_artistic_photos_to_artworks()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  total_count INTEGER
) AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_total_count INTEGER := 0;
  photo_record RECORD;
BEGIN
  -- Count total artistic photos
  SELECT COUNT(*) INTO v_total_count
  FROM public.photos
  WHERE category = 'artistic';
  
  -- Iterate through artistic photos and migrate
  FOR photo_record IN 
    SELECT * FROM public.photos 
    WHERE category = 'artistic'
    ORDER BY created_at
  LOOP
    -- Check if already migrated (by checking if an artwork exists with same primary_image_url)
    IF EXISTS (
      SELECT 1 FROM public.artworks 
      WHERE primary_image_url = photo_record.image_url
    ) THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    -- Insert into artworks table
    INSERT INTO public.artworks (
      id, -- Use same UUID to maintain consistency
      title,
      description,
      primary_image_url,
      primary_image_original_url,
      primary_image_width,
      primary_image_height,
      is_published,
      position_x,
      position_y,
      width,
      height,
      scale,
      rotation,
      z_index,
      layout_config,
      tags,
      copyright,
      created_at,
      updated_at,
      -- Map additional photo metadata if available
      creation_date,
      paper_type
    ) VALUES (
      photo_record.id,
      COALESCE(photo_record.title, 'Untitled Artwork'),
      photo_record.description,
      photo_record.image_url,
      photo_record.original_file_url,
      photo_record.original_width,
      photo_record.original_height,
      NOT photo_record.is_draft, -- Convert is_draft to is_published
      photo_record.position_x,
      photo_record.position_y,
      photo_record.width,
      photo_record.height,
      photo_record.scale,
      photo_record.rotation,
      photo_record.z_index,
      photo_record.layout_config,
      photo_record.tags,
      COALESCE(photo_record.credits, '© Ankur Bag.'),
      photo_record.created_at,
      photo_record.updated_at,
      -- Try to extract date from date_taken or year
      CASE 
        WHEN photo_record.date_taken IS NOT NULL THEN photo_record.date_taken::DATE
        WHEN photo_record.year IS NOT NULL THEN make_date(photo_record.year, 1, 1)
        ELSE NULL
      END,
      photo_record.device_used -- Map device_used to paper_type as best guess
    );
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated_count, v_skipped_count, v_total_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration (commented out by default - run manually after verification)
-- SELECT * FROM migrate_artistic_photos_to_artworks();

-- Create a verification query to compare data
CREATE OR REPLACE VIEW artistic_migration_verification AS
SELECT 
  'photos' AS source_table,
  COUNT(*) AS record_count,
  COUNT(DISTINCT id) AS unique_ids,
  MIN(created_at) AS earliest_date,
  MAX(created_at) AS latest_date
FROM public.photos
WHERE category = 'artistic'
UNION ALL
SELECT 
  'artworks' AS source_table,
  COUNT(*) AS record_count,
  COUNT(DISTINCT id) AS unique_ids,
  MIN(created_at) AS earliest_date,
  MAX(created_at) AS latest_date
FROM public.artworks;

COMMENT ON FUNCTION migrate_artistic_photos_to_artworks() IS 'One-time migration function to copy artistic photos to artworks table. Returns counts of migrated, skipped, and total records.';
COMMENT ON VIEW artistic_migration_verification IS 'Verification view to compare artistic photos and artworks counts before and after migration.';
