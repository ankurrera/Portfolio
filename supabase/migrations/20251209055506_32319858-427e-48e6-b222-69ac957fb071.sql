-- Add WYSIWYG layout columns to photos table
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS position_x integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS width integer NOT NULL DEFAULT 400,
ADD COLUMN IF NOT EXISTS height integer NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS scale numeric(4,2) NOT NULL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS rotation integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS z_index integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS layout_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add index for faster draft/published queries
CREATE INDEX IF NOT EXISTS idx_photos_is_draft ON public.photos(is_draft);
CREATE INDEX IF NOT EXISTS idx_photos_z_index ON public.photos(z_index);

-- Update existing RLS policies to allow updating the new columns
-- (existing policies already cover UPDATE for admins)