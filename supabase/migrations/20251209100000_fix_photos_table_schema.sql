-- Fix photos table schema to ensure all WYSIWYG layout columns exist with correct types
-- This migration addresses schema caching issues and column type inconsistencies

-- First, drop the columns if they exist to ensure we can recreate them with correct types
ALTER TABLE public.photos
DROP COLUMN IF EXISTS position_x,
DROP COLUMN IF EXISTS position_y,
DROP COLUMN IF EXISTS width,
DROP COLUMN IF EXISTS height,
DROP COLUMN IF EXISTS scale,
DROP COLUMN IF EXISTS rotation,
DROP COLUMN IF EXISTS z_index,
DROP COLUMN IF EXISTS is_draft,
DROP COLUMN IF EXISTS layout_config;

-- Now add all columns with correct and consistent types
ALTER TABLE public.photos
ADD COLUMN position_x FLOAT NOT NULL DEFAULT 0,
ADD COLUMN position_y FLOAT NOT NULL DEFAULT 0,
ADD COLUMN width FLOAT NOT NULL DEFAULT 300,
ADD COLUMN height FLOAT NOT NULL DEFAULT 400,
ADD COLUMN scale FLOAT NOT NULL DEFAULT 1.0,
ADD COLUMN rotation FLOAT NOT NULL DEFAULT 0,
ADD COLUMN z_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN layout_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create indexes for performance
DROP INDEX IF EXISTS idx_photos_z_index;
DROP INDEX IF EXISTS idx_photos_is_draft;

CREATE INDEX idx_photos_z_index ON public.photos(z_index);
CREATE INDEX idx_photos_is_draft ON public.photos(is_draft);
CREATE INDEX idx_photos_category_draft ON public.photos(category, is_draft);

-- Add comment to document the schema
COMMENT ON COLUMN public.photos.position_x IS 'X position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.position_y IS 'Y position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.width IS 'Width in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.height IS 'Height in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.scale IS 'Scale factor for photo (1.0 = 100%)';
COMMENT ON COLUMN public.photos.rotation IS 'Rotation angle in degrees';
COMMENT ON COLUMN public.photos.z_index IS 'Z-index for layering photos (higher = front)';
COMMENT ON COLUMN public.photos.is_draft IS 'Whether this photo layout is a draft (true) or published (false)';
COMMENT ON COLUMN public.photos.layout_config IS 'Additional layout configuration as JSON';
