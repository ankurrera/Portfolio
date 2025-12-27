-- Create technical_skills table for managing skills displayed in Technical Portfolio
-- This table stores skill categories like Frontend, Backend, Tools, Specialties

CREATE TABLE public.technical_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on technical_skills
ALTER TABLE public.technical_skills ENABLE ROW LEVEL SECURITY;

-- Public can view visible skills
CREATE POLICY "Anyone can view visible technical skills"
ON public.technical_skills
FOR SELECT
USING (is_visible = true);

-- Only admins can insert skills
CREATE POLICY "Admins can insert technical skills"
ON public.technical_skills
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update skills
CREATE POLICY "Admins can update technical skills"
ON public.technical_skills
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete skills
CREATE POLICY "Admins can delete technical skills"
ON public.technical_skills
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_technical_skills_order ON public.technical_skills(order_index);
CREATE INDEX idx_technical_skills_visible ON public.technical_skills(is_visible);

-- Add comments to document the schema
COMMENT ON TABLE public.technical_skills IS 'Technical skills displayed in Technical Portfolio section';
COMMENT ON COLUMN public.technical_skills.category IS 'Skill category name (e.g., Frontend, Backend, Tools, Specialties)';
COMMENT ON COLUMN public.technical_skills.skills IS 'Array of skill names in this category';
COMMENT ON COLUMN public.technical_skills.order_index IS 'Order for displaying categories (lower numbers first)';
COMMENT ON COLUMN public.technical_skills.is_visible IS 'Whether this category should be displayed on the public page';

-- Seed initial data from existing hardcoded values
INSERT INTO public.technical_skills (category, skills, order_index, is_visible) VALUES
  ('Frontend', ARRAY['React', 'TypeScript', 'Next.js', 'Vue.js'], 1, true),
  ('Backend', ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB'], 2, true),
  ('Tools', ARRAY['AWS', 'Docker', 'Git', 'Figma'], 3, true),
  ('Specialties', ARRAY['AI/ML', 'Web3', 'Performance', 'Security'], 4, true);
