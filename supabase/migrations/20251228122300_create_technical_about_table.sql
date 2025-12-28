-- Create technical_about table for managing the About section content in Technical Portfolio
-- This table stores section metadata, content blocks (paragraphs), and stats

CREATE TABLE IF NOT EXISTS public.technical_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_label TEXT NOT NULL DEFAULT 'About',
  heading TEXT NOT NULL DEFAULT 'Who Am I?',
  content_blocks JSONB NOT NULL DEFAULT '[]', -- Array of text blocks/paragraphs
  stats JSONB NOT NULL DEFAULT '[]', -- Array of { value: string, label: string }
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on technical_about
ALTER TABLE public.technical_about ENABLE ROW LEVEL SECURITY;

-- Public can read the about section
CREATE POLICY "Anyone can view technical about section"
ON public.technical_about
FOR SELECT
TO public
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert technical about section"
ON public.technical_about
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can update
CREATE POLICY "Admins can update technical about section"
ON public.technical_about
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can delete
CREATE POLICY "Admins can delete technical about section"
ON public.technical_about
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_technical_about_updated_at
  BEFORE UPDATE ON public.technical_about
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the schema
COMMENT ON TABLE public.technical_about IS 'About section content for Technical Portfolio page';
COMMENT ON COLUMN public.technical_about.section_label IS 'Small label text above heading (e.g., "ABOUT")';
COMMENT ON COLUMN public.technical_about.heading IS 'Main heading text (e.g., "Who Am I?")';
COMMENT ON COLUMN public.technical_about.content_blocks IS 'Array of paragraph text blocks in order';
COMMENT ON COLUMN public.technical_about.stats IS 'Array of stat objects with value and label properties';

-- Seed initial data from existing hardcoded values in MinimalAbout.tsx
INSERT INTO public.technical_about (
  section_label,
  heading,
  content_blocks,
  stats
) VALUES (
  'About',
  'Who Am I?',
  '[
    "I''m a passionate full-stack Web developer with over 1 year of experience creating digital solutions that matter.",
    "My journey began with a curiosity about how things work. Today, I specialize in building scalable web applications, integrating AI capabilities, and crafting user experiences that feel natural and intuitive.",
    "When I''m not coding, you''ll find me exploring new technologies, contributing to open source projects, or sharing knowledge with the developer community."
  ]'::jsonb,
  '[
    {"value": "10+", "label": "Projects Delivered"},
    {"value": "9+", "label": "Happy Clients"}
  ]'::jsonb
);
