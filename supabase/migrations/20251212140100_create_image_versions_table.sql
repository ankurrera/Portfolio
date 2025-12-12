-- Create image_versions table to track image replacements and maintain backup history
-- This supports the requirement to preserve backups when images are replaced

CREATE TABLE IF NOT EXISTS public.image_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  original_file_url TEXT,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  size_bytes BIGINT,
  replaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replaced_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_image_versions_photo_id ON public.image_versions(photo_id);
CREATE INDEX idx_image_versions_version ON public.image_versions(photo_id, version_number DESC);

-- Add RLS policies
ALTER TABLE public.image_versions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view image versions (for public gallery access)
CREATE POLICY "Anyone can view image versions"
  ON public.image_versions
  FOR SELECT
  USING (true);

-- Only admins can insert image versions
CREATE POLICY "Admins can insert image versions"
  ON public.image_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.image_versions IS 'Stores version history when images are replaced';
COMMENT ON COLUMN public.image_versions.version_number IS 'Sequential version number (1 = original, 2 = first replacement, etc.)';
COMMENT ON COLUMN public.image_versions.replaced_by IS 'User ID who performed the replacement';
