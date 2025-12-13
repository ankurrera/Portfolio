-- Create achievements table for storing achievement certificates
-- This migration creates a table for storing achievements across different categories

CREATE TABLE IF NOT EXISTS public.achievements (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core achievement information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('School', 'College', 'National', 'Online Courses', 'Extra Curricular')),
  
  -- Image information
  image_url TEXT NOT NULL, -- Certificate image (derivative)
  image_original_url TEXT, -- Original high-res image
  image_width INTEGER,
  image_height INTEGER,
  
  -- Display settings
  display_order INTEGER DEFAULT 0, -- Order within category (lower numbers show first)
  is_published BOOLEAN DEFAULT false,
  external_link TEXT, -- Link to certificate verification or external source
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_published ON public.achievements(is_published);
CREATE INDEX IF NOT EXISTS idx_achievements_display_order ON public.achievements(display_order);
CREATE INDEX IF NOT EXISTS idx_achievements_category_order ON public.achievements(category, display_order);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view published achievements
CREATE POLICY "Public can view published achievements"
  ON public.achievements
  FOR SELECT
  USING (is_published = true);

-- RLS Policy: Admin/Editor can view all achievements
CREATE POLICY "Admin can view all achievements"
  ON public.achievements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Admin/Editor can insert achievements
CREATE POLICY "Admin can insert achievements"
  ON public.achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Admin/Editor can update achievements
CREATE POLICY "Admin can update achievements"
  ON public.achievements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Admin/Editor can delete achievements
CREATE POLICY "Admin can delete achievements"
  ON public.achievements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_achievements_updated_at();

-- Add comment to the table
COMMENT ON TABLE public.achievements IS 'Stores achievement certificates across different categories with display order';
