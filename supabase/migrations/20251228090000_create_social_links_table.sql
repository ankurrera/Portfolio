-- Create social_links table for managing social and professional profile links
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type TEXT NOT NULL CHECK (link_type IN ('resume', 'github', 'linkedin', 'twitter', 'telegram')),
  url TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(link_type)
);

-- Create resume_download_logs table for tracking resume downloads
CREATE TABLE public.resume_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_agent TEXT,
  referrer TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on social_links
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Public can view visible social_links
CREATE POLICY "Anyone can view visible social_links"
ON public.social_links
FOR SELECT
USING (is_visible = true);

-- Admins can view all social_links
CREATE POLICY "Admins can view all social_links"
ON public.social_links
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert social_links
CREATE POLICY "Admins can insert social_links"
ON public.social_links
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update social_links
CREATE POLICY "Admins can update social_links"
ON public.social_links
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete social_links
CREATE POLICY "Admins can delete social_links"
ON public.social_links
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on resume_download_logs
ALTER TABLE public.resume_download_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert download logs
CREATE POLICY "Anyone can insert resume_download_logs"
ON public.resume_download_logs
FOR INSERT
WITH CHECK (true);

-- Only admins can view download logs
CREATE POLICY "Admins can view resume_download_logs"
ON public.resume_download_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for social_links
CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_social_links_display_order ON public.social_links(display_order);
CREATE INDEX idx_social_links_is_visible ON public.social_links(is_visible);
CREATE INDEX idx_resume_download_logs_downloaded_at ON public.resume_download_logs(downloaded_at DESC);

-- Seed initial data (all links initially empty and hidden)
INSERT INTO public.social_links (link_type, url, is_visible, display_order) VALUES
  ('resume', '', false, 0),
  ('github', '', false, 1),
  ('linkedin', '', false, 2),
  ('twitter', '', false, 3),
  ('telegram', '', false, 4);
