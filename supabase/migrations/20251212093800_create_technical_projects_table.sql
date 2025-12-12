-- Create technical_projects table for managing technical projects/portfolio
-- Similar structure to photos table but adapted for technical projects

CREATE TABLE public.technical_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  github_link TEXT,
  live_link TEXT,
  dev_year TEXT NOT NULL,
  status TEXT DEFAULT 'Live',
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on technical_projects
ALTER TABLE public.technical_projects ENABLE ROW LEVEL SECURITY;

-- Public can view published projects
CREATE POLICY "Anyone can view technical projects"
ON public.technical_projects
FOR SELECT
USING (true);

-- Only admins can insert projects
CREATE POLICY "Admins can insert technical projects"
ON public.technical_projects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update projects
CREATE POLICY "Admins can update technical projects"
ON public.technical_projects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete projects
CREATE POLICY "Admins can delete technical projects"
ON public.technical_projects
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for technical_projects
CREATE TRIGGER update_technical_projects_updated_at
BEFORE UPDATE ON public.technical_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_technical_projects_display_order ON public.technical_projects(display_order);
CREATE INDEX idx_technical_projects_dev_year ON public.technical_projects(dev_year);

-- Add comments to document the schema
COMMENT ON TABLE public.technical_projects IS 'Technical projects portfolio with metadata for admin management';
COMMENT ON COLUMN public.technical_projects.title IS 'Project title/name';
COMMENT ON COLUMN public.technical_projects.description IS 'Project description';
COMMENT ON COLUMN public.technical_projects.thumbnail_url IS 'Optional project thumbnail/image URL';
COMMENT ON COLUMN public.technical_projects.github_link IS 'GitHub repository link';
COMMENT ON COLUMN public.technical_projects.live_link IS 'Live project/demo link';
COMMENT ON COLUMN public.technical_projects.dev_year IS 'Year the project was developed';
COMMENT ON COLUMN public.technical_projects.status IS 'Project status (e.g., Live, In Development)';
COMMENT ON COLUMN public.technical_projects.languages IS 'Array of programming languages/technologies used (stored as JSONB)';
COMMENT ON COLUMN public.technical_projects.display_order IS 'Order for displaying projects (lower numbers first)';

-- Create storage bucket for project images/thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-projects', 'technical-projects', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for technical-projects bucket
CREATE POLICY "Anyone can view technical project images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'technical-projects');

CREATE POLICY "Admins can upload technical project images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update technical project images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete technical project images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));
