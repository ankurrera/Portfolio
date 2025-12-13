-- Create artworks table for storing artistic work separate from photoshoots
-- This migration creates a dedicated table for artworks with specialized metadata

CREATE TABLE IF NOT EXISTS public.artworks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core artwork information
  title TEXT NOT NULL,
  creation_date DATE,
  description TEXT, -- Concept/description (2-3 lines recommended)
  
  -- Dimensions
  dimension_preset TEXT CHECK (dimension_preset IN ('A4', 'A3', 'Custom')),
  custom_width DECIMAL(10, 2),
  custom_height DECIMAL(10, 2),
  dimension_unit TEXT DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in', 'mm')),
  
  -- Materials used (structured as JSONB for flexibility)
  pencil_grades TEXT[], -- e.g., ['HB', '2B', '4B', '6B']
  charcoal_types TEXT[], -- e.g., ['Compressed', 'Vine', 'White']
  paper_type TEXT,
  
  -- Additional metadata
  time_taken TEXT, -- Free text for time description
  tags TEXT[] DEFAULT '{}', -- Category/Collection tags
  copyright TEXT DEFAULT '© Ankur Bag.',
  
  -- Images
  primary_image_url TEXT NOT NULL, -- Primary artwork image (derivative)
  primary_image_original_url TEXT, -- Original high-res image
  primary_image_width INTEGER,
  primary_image_height INTEGER,
  process_images JSONB DEFAULT '[]'::jsonb, -- Array of { url, original_url, caption }
  
  -- Display settings
  is_published BOOLEAN DEFAULT false,
  external_link TEXT, -- Purchase link or external gallery
  
  -- WYSIWYG layout fields (same as photos table for consistency)
  position_x DECIMAL(10, 2) DEFAULT 0,
  position_y DECIMAL(10, 2) DEFAULT 0,
  width DECIMAL(10, 2) DEFAULT 800,
  height DECIMAL(10, 2) DEFAULT 1000,
  scale DECIMAL(10, 4) DEFAULT 1.0,
  rotation DECIMAL(10, 2) DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  layout_config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_is_published ON public.artworks(is_published);
CREATE INDEX IF NOT EXISTS idx_artworks_tags ON public.artworks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_artworks_creation_date ON public.artworks(creation_date);
CREATE INDEX IF NOT EXISTS idx_artworks_z_index ON public.artworks(z_index);

-- Enable Row Level Security
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view published artworks
CREATE POLICY "Public can view published artworks"
  ON public.artworks
  FOR SELECT
  USING (is_published = true);

-- RLS Policy: Admin/Editor can view all artworks
CREATE POLICY "Admin can view all artworks"
  ON public.artworks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Admin/Editor can insert artworks
CREATE POLICY "Admin can insert artworks"
  ON public.artworks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- RLS Policy: Admin/Editor can update artworks
CREATE POLICY "Admin can update artworks"
  ON public.artworks
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

-- RLS Policy: Admin/Editor can delete artworks
CREATE POLICY "Admin can delete artworks"
  ON public.artworks
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
CREATE OR REPLACE FUNCTION public.update_artworks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_artworks_updated_at();

-- Add comment to the table
COMMENT ON TABLE public.artworks IS 'Stores artistic works with specialized metadata separate from photoshoots';
