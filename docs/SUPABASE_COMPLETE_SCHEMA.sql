-- ============================================================================
-- SUPABASE COMPLETE DATABASE SCHEMA FOR PORTFOLIO PROJECT
-- ============================================================================
-- 
-- This file contains all SQL commands needed to recreate the complete
-- database schema from scratch. Run this in Supabase SQL Editor.
--
-- INSTRUCTIONS:
-- 1. Create a new Supabase project at https://app.supabase.com
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Create a new query and paste this entire file
-- 4. Click "Run" to execute
--
-- After running, you should have:
-- - All tables (photos, user_roles, artworks, achievements, etc.)
-- - All storage buckets (photos, technical-projects)
-- - All RLS policies for security
-- - All triggers for auto-updating timestamps
-- - Seed data for skills, about sections, and social links
--
-- ============================================================================


-- ============================================================================
-- PART 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- PART 2: ENUMS (Custom Types)
-- ============================================================================

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create photo_category enum (with artistic category)
CREATE TYPE public.photo_category AS ENUM ('selected', 'commissioned', 'editorial', 'personal', 'artistic');


-- ============================================================================
-- PART 3: UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


-- ============================================================================
-- PART 4: USER_ROLES TABLE
-- ============================================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.user_roles TO postgres, service_role;


-- ============================================================================
-- PART 5: AUTO USER ROLE TRIGGER
-- ============================================================================

-- Function to handle new user signup - first user becomes admin, others get user role
CREATE OR REPLACE FUNCTION public.handle_new_user_with_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user by checking if user_roles is empty
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    -- First user gets admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- All subsequent users get 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run when new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_first_admin();


-- ============================================================================
-- PART 6: PHOTOS TABLE
-- ============================================================================

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- WYSIWYG Layout fields
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 300,
  height FLOAT NOT NULL DEFAULT 400,
  scale FLOAT NOT NULL DEFAULT 1.0,
  rotation FLOAT NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Photo metadata fields
  caption TEXT,
  photographer_name TEXT,
  date_taken DATE,
  device_used TEXT,
  video_thumbnail_url TEXT,
  
  -- Original file tracking columns
  original_file_url TEXT,
  original_width INTEGER,
  original_height INTEGER,
  original_mime_type TEXT,
  original_size_bytes BIGINT,
  
  -- Extended metadata
  year INTEGER,
  tags TEXT[],
  credits TEXT,
  camera_lens TEXT,
  project_visibility TEXT DEFAULT 'public',
  external_links JSONB DEFAULT '[]'::jsonb,
  
  -- Video media support
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  video_duration_seconds NUMERIC,
  video_width INTEGER,
  video_height INTEGER,
  video_url TEXT
);

-- Create indexes for performance
CREATE INDEX idx_photos_z_index ON public.photos(z_index);
CREATE INDEX idx_photos_is_draft ON public.photos(is_draft);
CREATE INDEX idx_photos_tags ON public.photos USING GIN (tags);
CREATE INDEX idx_photos_year ON public.photos(year);
CREATE INDEX idx_photos_visibility ON public.photos(project_visibility);
CREATE INDEX idx_photos_media_type ON public.photos(media_type);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for photos
CREATE POLICY "Anyone can view photos"
ON public.photos
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert photos"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON public.photos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON public.photos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for photos
CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON COLUMN public.photos.position_x IS 'X position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.position_y IS 'Y position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.width IS 'Width in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.height IS 'Height in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.scale IS 'Scale factor for photo (1.0 = 100%)';
COMMENT ON COLUMN public.photos.rotation IS 'Rotation angle in degrees';
COMMENT ON COLUMN public.photos.z_index IS 'Z-index for layering photos (higher = front)';
COMMENT ON COLUMN public.photos.is_draft IS 'Whether this photo layout is a draft (true) or published (false)';
COMMENT ON COLUMN public.photos.layout_config IS 'Additional layout configuration as JSON';
COMMENT ON COLUMN public.photos.media_type IS 'Type of media: image or video';


-- ============================================================================
-- PART 7: PHOTO_LAYOUT_REVISIONS TABLE
-- ============================================================================

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

-- RLS policies
CREATE POLICY "Admins can view layout revisions"
ON public.photo_layout_revisions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert layout revisions"
ON public.photo_layout_revisions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete layout revisions"
ON public.photo_layout_revisions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================================
-- PART 8: IMAGE_VERSIONS TABLE
-- ============================================================================

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

CREATE POLICY "Anyone can view image versions"
  ON public.image_versions
  FOR SELECT
  USING (true);

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

COMMENT ON TABLE public.image_versions IS 'Stores version history when images are replaced';
COMMENT ON COLUMN public.image_versions.version_number IS 'Sequential version number (1 = original, 2 = first replacement, etc.)';


-- ============================================================================
-- PART 9: ARTWORKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core artwork information
  title TEXT NOT NULL,
  creation_date DATE,
  description TEXT,
  
  -- Dimensions
  dimension_preset TEXT CHECK (dimension_preset IN ('A4', 'A3', 'Custom')),
  custom_width DECIMAL(10, 2),
  custom_height DECIMAL(10, 2),
  dimension_unit TEXT DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in', 'mm')),
  
  -- Materials used
  pencil_grades TEXT[],
  charcoal_types TEXT[],
  paper_type TEXT,
  
  -- Additional metadata
  time_taken TEXT,
  tags TEXT[] DEFAULT '{}',
  copyright TEXT DEFAULT '© Ankur Bag.',
  
  -- Images
  primary_image_url TEXT NOT NULL,
  primary_image_original_url TEXT,
  primary_image_width INTEGER,
  primary_image_height INTEGER,
  process_images JSONB DEFAULT '[]'::jsonb,
  
  -- Display settings
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  
  -- WYSIWYG layout fields
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

-- RLS Policies for artworks
CREATE POLICY "Public can view published artworks"
  ON public.artworks
  FOR SELECT
  USING (is_published = true);

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

-- Trigger for updated_at
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

COMMENT ON TABLE public.artworks IS 'Stores artistic works with specialized metadata separate from photoshoots';


-- ============================================================================
-- PART 10: ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core achievement information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('School', 'College', 'National', 'Online Courses', 'Extracurricular', 'Internships')),
  year INTEGER,
  
  -- Image information
  image_url TEXT NOT NULL,
  image_original_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  
  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  
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

-- RLS Policies for achievements
CREATE POLICY "Public can view published achievements"
  ON public.achievements
  FOR SELECT
  USING (is_published = true);

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

-- Trigger for updated_at
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

COMMENT ON TABLE public.achievements IS 'Stores achievement certificates across different categories with display order';


-- ============================================================================
-- PART 11: TECHNICAL_PROJECTS TABLE
-- ============================================================================

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
  progress INTEGER DEFAULT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT progress_range CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100))
);

-- Enable RLS on technical_projects
ALTER TABLE public.technical_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view technical projects"
ON public.technical_projects
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert technical projects"
ON public.technical_projects
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update technical projects"
ON public.technical_projects
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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
CREATE INDEX IF NOT EXISTS idx_technical_projects_progress ON public.technical_projects(progress);

-- Add comments
COMMENT ON TABLE public.technical_projects IS 'Technical projects portfolio with metadata for admin management';
COMMENT ON COLUMN public.technical_projects.languages IS 'Array of programming languages/technologies used (stored as JSONB)';
COMMENT ON COLUMN public.technical_projects.progress IS 'Project completion progress as percentage (0-100). NULL for projects without progress tracking.';


-- ============================================================================
-- PART 12: TECHNICAL_SKILLS TABLE
-- ============================================================================

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

-- RLS policies
CREATE POLICY "Anyone can view visible technical skills"
ON public.technical_skills
FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can insert technical skills"
ON public.technical_skills
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update technical skills"
ON public.technical_skills
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete technical skills"
ON public.technical_skills
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_technical_skills_order ON public.technical_skills(order_index);
CREATE INDEX idx_technical_skills_visible ON public.technical_skills(is_visible);

COMMENT ON TABLE public.technical_skills IS 'Technical skills displayed in Technical Portfolio section';


-- ============================================================================
-- PART 13: HERO_TEXT TABLE
-- ============================================================================

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

-- RLS policies
CREATE POLICY "Anyone can view hero_text"
ON public.hero_text
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hero_text"
ON public.hero_text
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hero_text"
ON public.hero_text
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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

-- Add constraint
ALTER TABLE public.hero_text ADD CONSTRAINT hero_text_page_slug_not_empty CHECK (page_slug <> '');


-- ============================================================================
-- PART 14: ABOUT_PAGE TABLE
-- ============================================================================

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

-- RLS policies
CREATE POLICY "Anyone can view about_page"
ON public.about_page
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert about_page"
ON public.about_page
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update about_page"
ON public.about_page
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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


-- ============================================================================
-- PART 15: TECHNICAL_ABOUT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technical_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_label TEXT NOT NULL DEFAULT 'About',
  heading TEXT NOT NULL DEFAULT 'Who Am I?',
  content_blocks JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on technical_about
ALTER TABLE public.technical_about ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view technical about section"
ON public.technical_about
FOR SELECT
TO public
USING (true);

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

-- Create trigger for updated_at
CREATE TRIGGER update_technical_about_updated_at
  BEFORE UPDATE ON public.technical_about
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.technical_about IS 'About section content for Technical Portfolio page';


-- ============================================================================
-- PART 16: EDUCATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  start_year TEXT NOT NULL,
  end_year TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_education_display_order ON education(display_order);

-- Enable RLS
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access for education"
  ON education
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin insert for education"
  ON education
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for education"
  ON education
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for education"
  ON education
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- PART 17: ABOUT_EXPERIENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS about_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_about_experience_display_order ON about_experience(display_order);

-- Enable RLS
ALTER TABLE about_experience ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access for about_experience"
  ON about_experience
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin insert for about_experience"
  ON about_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for about_experience"
  ON about_experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for about_experience"
  ON about_experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_about_experience_updated_at
  BEFORE UPDATE ON about_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE about_experience IS 'Work experience entries for the About page (photography/creative work)';


-- ============================================================================
-- PART 18: TECHNICAL_EXPERIENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS technical_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_technical_experience_display_order ON technical_experience(display_order);

-- Enable RLS
ALTER TABLE technical_experience ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow public read access for technical_experience"
  ON technical_experience
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin insert for technical_experience"
  ON technical_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for technical_experience"
  ON technical_experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for technical_experience"
  ON technical_experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_technical_experience_updated_at
  BEFORE UPDATE ON technical_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE technical_experience IS 'Professional experience entries for the Technical Portfolio page';


-- ============================================================================
-- PART 19: SOCIAL_LINKS TABLE
-- ============================================================================

CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_context TEXT NOT NULL CHECK (page_context IN ('about', 'technical')),
  link_type TEXT NOT NULL CHECK (link_type IN ('resume', 'github', 'linkedin', 'twitter', 'telegram')),
  url TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_context, link_type)
);

-- Enable RLS on social_links
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view visible social_links"
ON public.social_links
FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can view all social_links"
ON public.social_links
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert social_links"
ON public.social_links
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update social_links"
ON public.social_links
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete social_links"
ON public.social_links
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_social_links_display_order ON public.social_links(display_order);
CREATE INDEX idx_social_links_is_visible ON public.social_links(is_visible);
CREATE INDEX idx_social_links_page_context ON public.social_links(page_context);


-- ============================================================================
-- PART 20: RESUME_DOWNLOAD_LOGS TABLE
-- ============================================================================

CREATE TABLE public.resume_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_agent TEXT,
  referrer TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resume_download_logs
ALTER TABLE public.resume_download_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can insert resume_download_logs"
ON public.resume_download_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view resume_download_logs"
ON public.resume_download_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index
CREATE INDEX idx_resume_download_logs_downloaded_at ON public.resume_download_logs(downloaded_at DESC);


-- ============================================================================
-- PART 21: STORAGE BUCKETS
-- ============================================================================

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for technical project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-projects', 'technical-projects', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- PART 22: STORAGE POLICIES
-- ============================================================================

-- Storage policies for photos bucket
CREATE POLICY "Anyone can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

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


-- ============================================================================
-- PART 23: SEED DATA
-- ============================================================================

-- Seed hero_text data
INSERT INTO public.hero_text (page_slug, hero_title, hero_subtitle, hero_description) VALUES
('home', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('about', 'Ankur Bag', 'PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.'),
('artistic', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('technical', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('photoshoots', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
('achievement', 'Achievements', 'AWARDS & RECOGNITIONS', 'Explore achievements across different categories. Hover over each folder to preview certificates.')
ON CONFLICT (page_slug) DO NOTHING;

-- Seed about_page data
INSERT INTO public.about_page (profile_image_url, bio_text, services) VALUES
(
  NULL,
  E'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.\n\nFull production services including art buying, location scouting, casting, and on-set management. Collaborative approach ensuring seamless execution from concept to delivery.',
  '[
    {"id": "1", "title": "Fashion & Editorial Photography", "description": "High-end fashion and editorial photography for brands and publications"},
    {"id": "2", "title": "Commercial Production", "description": "Full-service commercial photography production"},
    {"id": "3", "title": "Art Buying & Creative Direction", "description": "Professional art buying and creative direction services"},
    {"id": "4", "title": "Location Scouting", "description": "Expert location scouting for perfect shoot environments"},
    {"id": "5", "title": "Casting & Talent Coordination", "description": "Professional casting and talent management"}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Seed technical_about data
INSERT INTO public.technical_about (section_label, heading, content_blocks, stats) VALUES (
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
)
ON CONFLICT DO NOTHING;

-- Seed technical_skills data
INSERT INTO public.technical_skills (category, skills, order_index, is_visible) VALUES
  ('Frontend', ARRAY['React', 'TypeScript', 'Next.js', 'Vue.js'], 1, true),
  ('Backend', ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB'], 2, true),
  ('Tools', ARRAY['AWS', 'Docker', 'Git', 'Figma'], 3, true),
  ('Specialties', ARRAY['AI/ML', 'Web3', 'Performance', 'Security'], 4, true)
ON CONFLICT DO NOTHING;

-- Seed technical_experience data
INSERT INTO technical_experience (role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
VALUES 
  ('Website Developer', 'Digital Indian pvt Solution', 'Full-time', '08/2024', NULL, true, 1),
  ('Google Map 360 Photographer', 'Instanovate', 'Contract', '02/2025', '03/2025', false, 2),
  ('Cinematography/ Editing', 'Freelance', 'Freelance', '2019', NULL, true, 3)
ON CONFLICT DO NOTHING;

-- Seed social_links data for About page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('about', 'resume', '', false, 0),
  ('about', 'github', '', false, 1),
  ('about', 'linkedin', '', false, 2),
  ('about', 'twitter', '', false, 3),
  ('about', 'telegram', '', false, 4)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- Seed social_links data for Technical page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('technical', 'github', '', false, 0),
  ('technical', 'linkedin', '', false, 1),
  ('technical', 'twitter', '', false, 2)
ON CONFLICT (page_context, link_type) DO NOTHING;


-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- Your database schema has been set up successfully!
-- 
-- NEXT STEPS:
-- 1. Update your .env file with your Supabase credentials
-- 2. Sign up for an account in your application
-- 3. The first user will automatically become an admin
-- 4. To manually make a user admin:
--    UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'your-user-id';
--
-- For more details, see docs/SUPABASE_SETUP.md
-- ============================================================================
