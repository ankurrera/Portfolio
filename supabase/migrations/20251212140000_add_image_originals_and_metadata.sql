-- Add fields for storing original image information and extended metadata
-- This migration addresses the requirement to preserve original images without forced cropping/compression

-- Add original file tracking columns
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS original_file_url TEXT,
ADD COLUMN IF NOT EXISTS original_width INTEGER,
ADD COLUMN IF NOT EXISTS original_height INTEGER,
ADD COLUMN IF NOT EXISTS original_mime_type TEXT,
ADD COLUMN IF NOT EXISTS original_size_bytes BIGINT;

-- Add extended metadata columns
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS credits TEXT,
ADD COLUMN IF NOT EXISTS camera_lens TEXT,
ADD COLUMN IF NOT EXISTS project_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the new columns
COMMENT ON COLUMN public.photos.original_file_url IS 'URL to the original uploaded file (byte-for-byte, no compression)';
COMMENT ON COLUMN public.photos.original_width IS 'Original image width in pixels';
COMMENT ON COLUMN public.photos.original_height IS 'Original image height in pixels';
COMMENT ON COLUMN public.photos.original_mime_type IS 'Original MIME type (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN public.photos.original_size_bytes IS 'Original file size in bytes';
COMMENT ON COLUMN public.photos.year IS 'Year the photo/artwork was created';
COMMENT ON COLUMN public.photos.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN public.photos.credits IS 'Credits for collaborators, models, stylists, etc.';
COMMENT ON COLUMN public.photos.camera_lens IS 'Camera and lens information (e.g., "Canon EOS R5 + RF 50mm f/1.2")';
COMMENT ON COLUMN public.photos.project_visibility IS 'Visibility setting: public, private, unlisted';
COMMENT ON COLUMN public.photos.external_links IS 'Array of external links as JSON objects with title and url';

-- Create index on tags for search performance
CREATE INDEX IF NOT EXISTS idx_photos_tags ON public.photos USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_photos_year ON public.photos(year);
CREATE INDEX IF NOT EXISTS idx_photos_visibility ON public.photos(project_visibility);
