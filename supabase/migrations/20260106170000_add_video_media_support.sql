-- Add video media support to photos table
-- This migration adds fields to support video uploads alongside images

-- Add media_type field to distinguish between images and videos
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Add video-specific metadata columns
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS video_duration_seconds NUMERIC,
ADD COLUMN IF NOT EXISTS video_width INTEGER,
ADD COLUMN IF NOT EXISTS video_height INTEGER,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN public.photos.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN public.photos.video_duration_seconds IS 'Duration of video in seconds';
COMMENT ON COLUMN public.photos.video_width IS 'Video width in pixels';
COMMENT ON COLUMN public.photos.video_height IS 'Video height in pixels';
COMMENT ON COLUMN public.photos.video_url IS 'URL to the video file (for video media type)';

-- Create index on media_type for filtering
CREATE INDEX IF NOT EXISTS idx_photos_media_type ON public.photos(media_type);
