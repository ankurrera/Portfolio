-- Add layout and position fields to photos table for WYSIWYG editor
ALTER TABLE public.photos
ADD COLUMN position_x FLOAT DEFAULT 0,
ADD COLUMN position_y FLOAT DEFAULT 0,
ADD COLUMN width FLOAT DEFAULT 300,
ADD COLUMN height FLOAT DEFAULT 400,
ADD COLUMN scale FLOAT DEFAULT 1.0,
ADD COLUMN rotation FLOAT DEFAULT 0,
ADD COLUMN z_index INTEGER DEFAULT 0,
ADD COLUMN is_draft BOOLEAN DEFAULT false,
ADD COLUMN layout_config JSONB DEFAULT '{}'::jsonb;

-- Create index for z_index ordering
CREATE INDEX idx_photos_z_index ON public.photos(z_index);

-- Create table for layout revisions
CREATE TABLE public.photo_layout_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category photo_category NOT NULL,
  revision_name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on photo_layout_revisions
ALTER TABLE public.photo_layout_revisions ENABLE ROW LEVEL SECURITY;

-- Only admins can view revisions
CREATE POLICY "Admins can view layout revisions"
ON public.photo_layout_revisions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert revisions
CREATE POLICY "Admins can insert layout revisions"
ON public.photo_layout_revisions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete revisions
CREATE POLICY "Admins can delete layout revisions"
ON public.photo_layout_revisions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
