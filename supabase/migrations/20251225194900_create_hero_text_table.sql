-- Create hero_text table for dynamic hero sections
CREATE TABLE public.hero_text (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  background_media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on hero_text
ALTER TABLE public.hero_text ENABLE ROW LEVEL SECURITY;

-- Public can view hero_text
CREATE POLICY "Anyone can view hero_text"
ON public.hero_text
FOR SELECT
USING (true);

-- Only admins can insert hero_text
CREATE POLICY "Admins can insert hero_text"
ON public.hero_text
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update hero_text
CREATE POLICY "Admins can update hero_text"
ON public.hero_text
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete hero_text
CREATE POLICY "Admins can delete hero_text"
ON public.hero_text
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_hero_text_updated_at
BEFORE UPDATE ON public.hero_text
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique index on page_slug
CREATE UNIQUE INDEX hero_text_page_slug_idx ON public.hero_text(page_slug);

-- Add check constraint to prevent null page_slug
ALTER TABLE public.hero_text ADD CONSTRAINT hero_text_page_slug_not_empty CHECK (page_slug <> '');

-- Seed initial hero data for existing pages
INSERT INTO public.hero_text (page_slug, hero_title, hero_subtitle, hero_description) VALUES
('home', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('about', 'Ankur Bag', 'PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.'),
('artistic', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('technical', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('photoshoots', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('achievement', 'Achievements', 'AWARDS & RECOGNITIONS', 'Explore achievements across different categories. Hover over each folder to preview certificates.');
