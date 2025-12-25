-- Create about_page table for About page content management
CREATE TABLE public.about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_image_url TEXT,
  bio_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on about_page
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- Public can view about_page data
CREATE POLICY "Anyone can view about_page"
ON public.about_page
FOR SELECT
USING (true);

-- Only admins can insert about_page data
CREATE POLICY "Admins can insert about_page"
ON public.about_page
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update about_page data
CREATE POLICY "Admins can update about_page"
ON public.about_page
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete about_page data
CREATE POLICY "Admins can delete about_page"
ON public.about_page
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_about_page_updated_at
BEFORE UPDATE ON public.about_page
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data from existing About page content
INSERT INTO public.about_page (profile_image_url, bio_text, services) VALUES
(
  -- Profile image will be fetched from 'personal' category photos
  NULL,
  -- Bio text from current About page
  E'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.\n\nFull production services including art buying, location scouting, casting, and on-set management. Collaborative approach ensuring seamless execution from concept to delivery.',
  -- Services as JSON array
  '[
    {
      "id": "1",
      "title": "Fashion & Editorial Photography",
      "description": "High-end fashion and editorial photography for brands and publications"
    },
    {
      "id": "2",
      "title": "Commercial Production",
      "description": "Full-service commercial photography production"
    },
    {
      "id": "3",
      "title": "Art Buying & Creative Direction",
      "description": "Professional art buying and creative direction services"
    },
    {
      "id": "4",
      "title": "Location Scouting",
      "description": "Expert location scouting for perfect shoot environments"
    },
    {
      "id": "5",
      "title": "Casting & Talent Coordination",
      "description": "Professional casting and talent management"
    }
  ]'::jsonb
);
