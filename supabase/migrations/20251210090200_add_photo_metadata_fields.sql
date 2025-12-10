-- Add metadata fields to photos table for enhanced UX
-- These fields support photographer attribution, image context, and video thumbnails

ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS photographer_name TEXT,
ADD COLUMN IF NOT EXISTS date_taken DATE,
ADD COLUMN IF NOT EXISTS device_used TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN public.photos.caption IS 'Optional descriptive caption or context for the image';
COMMENT ON COLUMN public.photos.photographer_name IS 'Name of the photographer who took the photo';
COMMENT ON COLUMN public.photos.date_taken IS 'Date when the photograph was captured';
COMMENT ON COLUMN public.photos.device_used IS 'Camera or device used to capture the photo (e.g., iPhone 15 Pro, Nikon D850)';
COMMENT ON COLUMN public.photos.video_thumbnail_url IS 'Optional thumbnail image URL for videos (clickbait/live preview)';
