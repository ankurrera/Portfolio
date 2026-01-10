-- ============================================================================
-- SUPABASE DATABASE INITIALIZATION SCRIPT
-- ============================================================================
-- This consolidated script recreates the entire database schema from scratch.
-- Generated from 35 migration files.
-- 
-- Usage:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Run this entire script
-- 
-- Or use with Supabase CLI:
-- supabase db push (will use individual migration files)
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================
-- Note: Most extensions are pre-installed in Supabase

CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUMS
-- ============================================================================

-- Create app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- Create photo_category enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_category') THEN
    CREATE TYPE public.photo_category AS ENUM ('selected', 'commissioned', 'editorial', 'personal', 'artistic');
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================================

-- Function to check user roles (SECURITY DEFINER)
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

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to auto-assign roles to new users (first user = admin, others = user)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SECTION 4: TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: user_roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- -----------------------------------------------------------------------------
-- Table: photos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- WYSIWYG layout fields
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 300,
  height FLOAT NOT NULL DEFAULT 400,
  scale FLOAT NOT NULL DEFAULT 1.0,
  rotation FLOAT NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Metadata fields
  caption TEXT,
  photographer_name TEXT,
  date_taken DATE,
  device_used TEXT,
  video_thumbnail_url TEXT,
  -- Original file tracking
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
  -- Video support
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  video_duration_seconds NUMERIC,
  video_width INTEGER,
  video_height INTEGER,
  video_url TEXT
);

-- Comments for photos table
COMMENT ON TABLE public.photos IS 'Photos table for photoshoot gallery. Category column is optional/nullable if present for backward compatibility.';
COMMENT ON COLUMN public.photos.position_x IS 'X position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.position_y IS 'Y position in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.width IS 'Width in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.height IS 'Height in pixels for WYSIWYG layout';
COMMENT ON COLUMN public.photos.scale IS 'Scale factor for photo (1.0 = 100%)';
COMMENT ON COLUMN public.photos.rotation IS 'Rotation angle in degrees';
COMMENT ON COLUMN public.photos.z_index IS 'Z-index for layering photos (higher = front)';
COMMENT ON COLUMN public.photos.is_draft IS 'Whether this photo layout is a draft (true) or published (false)';
COMMENT ON COLUMN public.photos.layout_config IS 'Additional layout configuration as JSON';
COMMENT ON COLUMN public.photos.caption IS 'Optional descriptive caption or context for the image';
COMMENT ON COLUMN public.photos.photographer_name IS 'Name of the photographer who took the photo';
COMMENT ON COLUMN public.photos.date_taken IS 'Date when the photograph was captured';
COMMENT ON COLUMN public.photos.device_used IS 'Camera or device used to capture the photo (e.g., iPhone 15 Pro, Nikon D850)';
COMMENT ON COLUMN public.photos.video_thumbnail_url IS 'Optional thumbnail image URL for videos (clickbait/live preview)';
COMMENT ON COLUMN public.photos.original_file_url IS 'URL to the original uploaded file (byte-for-byte, no compression)';
COMMENT ON COLUMN public.photos.original_width IS 'Original image width in pixels';
COMMENT ON COLUMN public.photos.original_height IS 'Original image height in pixels';
COMMENT ON COLUMN public.photos.original_mime_type IS 'Original MIME type (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN public.photos.original_size_bytes IS 'Original file size in bytes';
COMMENT ON COLUMN public.photos.year IS 'Year the photo/artwork was created';
COMMENT ON COLUMN public.photos.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN public.photos.credits IS 'Credits for collaborators, models, stylists, etc.';
COMMENT ON COLUMN public.photos.camera_lens IS 'Camera and lens information (e.g., "Canon EOS R5 + RF 50mm f/1.2")';
COMMENT ON COLUMN public.photos.project_visibility IS 'Visibility setting: public, private, unlisted';
COMMENT ON COLUMN public.photos.external_links IS 'Array of external links as JSON objects with title and url';
COMMENT ON COLUMN public.photos.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN public.photos.video_duration_seconds IS 'Duration of video in seconds';
COMMENT ON COLUMN public.photos.video_width IS 'Video width in pixels';
COMMENT ON COLUMN public.photos.video_height IS 'Video height in pixels';
COMMENT ON COLUMN public.photos.video_url IS 'URL to the video file (for video media type)';

-- -----------------------------------------------------------------------------
-- Table: photo_layout_revisions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_layout_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category photo_category NOT NULL,
  revision_name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Table: image_versions
-- -----------------------------------------------------------------------------
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

COMMENT ON TABLE public.image_versions IS 'Stores version history when images are replaced';
COMMENT ON COLUMN public.image_versions.version_number IS 'Sequential version number (1 = original, 2 = first replacement, etc.)';
COMMENT ON COLUMN public.image_versions.replaced_by IS 'User ID who performed the replacement';

-- -----------------------------------------------------------------------------
-- Table: artworks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  creation_date DATE,
  description TEXT,
  dimension_preset TEXT CHECK (dimension_preset IN ('A4', 'A3', 'Custom')),
  custom_width DECIMAL(10, 2),
  custom_height DECIMAL(10, 2),
  dimension_unit TEXT DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in', 'mm')),
  pencil_grades TEXT[],
  charcoal_types TEXT[],
  paper_type TEXT,
  time_taken TEXT,
  tags TEXT[] DEFAULT '{}',
  copyright TEXT DEFAULT '© Ankur Bag.',
  primary_image_url TEXT NOT NULL,
  primary_image_original_url TEXT,
  primary_image_width INTEGER,
  primary_image_height INTEGER,
  process_images JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  position_x DECIMAL(10, 2) DEFAULT 0,
  position_y DECIMAL(10, 2) DEFAULT 0,
  width DECIMAL(10, 2) DEFAULT 800,
  height DECIMAL(10, 2) DEFAULT 1000,
  scale DECIMAL(10, 4) DEFAULT 1.0,
  rotation DECIMAL(10, 2) DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  layout_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.artworks IS 'Stores artistic works with specialized metadata separate from photoshoots';

-- -----------------------------------------------------------------------------
-- Table: achievements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('School', 'College', 'National', 'Online Courses', 'Extracurricular', 'Internships')),
  image_url TEXT NOT NULL,
  image_original_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.achievements IS 'Stores achievement certificates across different categories with display order';
COMMENT ON COLUMN public.achievements.year IS 'Year the achievement was received';
COMMENT ON COLUMN public.achievements.category IS 'Achievement category: School, College, National, Online Courses, Extracurricular (renamed from Extra Curricular), Internships (new)';

-- -----------------------------------------------------------------------------
-- Table: hero_text
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_text (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  background_media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT hero_text_page_slug_not_empty CHECK (page_slug <> '')
);

-- -----------------------------------------------------------------------------
-- Table: about_page
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_image_url TEXT,
  bio_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Table: education
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.education (
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

-- -----------------------------------------------------------------------------
-- Table: about_experience
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.about_experience (
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

COMMENT ON TABLE public.about_experience IS 'Work experience entries for the About page (photography/creative work)';
COMMENT ON COLUMN public.about_experience.logo_url IS 'URL to company/organization logo image';
COMMENT ON COLUMN public.about_experience.company_name IS 'Company or organization name';
COMMENT ON COLUMN public.about_experience.role IS 'Job title/role or work done';
COMMENT ON COLUMN public.about_experience.start_date IS 'Start date in YYYY-MM format';
COMMENT ON COLUMN public.about_experience.end_date IS 'End date in YYYY-MM format, NULL for current position';
COMMENT ON COLUMN public.about_experience.display_order IS 'Order for displaying experience entries (lower numbers first)';

-- -----------------------------------------------------------------------------
-- Table: technical_experience
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technical_experience (
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

COMMENT ON TABLE public.technical_experience IS 'Professional experience entries for the Technical Portfolio page';
COMMENT ON COLUMN public.technical_experience.role_title IS 'Job title/role';
COMMENT ON COLUMN public.technical_experience.company_name IS 'Company or organization name';
COMMENT ON COLUMN public.technical_experience.employment_type IS 'Type of employment: Full-time, Freelance, Contract, etc.';
COMMENT ON COLUMN public.technical_experience.start_date IS 'Start date in MM/YYYY or YYYY format';
COMMENT ON COLUMN public.technical_experience.end_date IS 'End date in MM/YYYY or YYYY format, NULL for current position';
COMMENT ON COLUMN public.technical_experience.is_current IS 'Boolean flag indicating if this is a current position';
COMMENT ON COLUMN public.technical_experience.display_order IS 'Order for displaying experience entries (lower numbers first)';

-- -----------------------------------------------------------------------------
-- Table: technical_projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technical_projects (
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
  progress INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT progress_range CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100))
);

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
COMMENT ON COLUMN public.technical_projects.progress IS 'Project completion progress as percentage (0-100). NULL for projects without progress tracking.';

-- -----------------------------------------------------------------------------
-- Table: technical_skills
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technical_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.technical_skills IS 'Technical skills displayed in Technical Portfolio section';
COMMENT ON COLUMN public.technical_skills.category IS 'Skill category name (e.g., Frontend, Backend, Tools, Specialties)';
COMMENT ON COLUMN public.technical_skills.skills IS 'Array of skill names in this category';
COMMENT ON COLUMN public.technical_skills.order_index IS 'Order for displaying categories (lower numbers first)';
COMMENT ON COLUMN public.technical_skills.is_visible IS 'Whether this category should be displayed on the public page';

-- -----------------------------------------------------------------------------
-- Table: technical_about
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.technical_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_label TEXT NOT NULL DEFAULT 'About',
  heading TEXT NOT NULL DEFAULT 'Who Am I?',
  content_blocks JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.technical_about IS 'About section content for Technical Portfolio page';
COMMENT ON COLUMN public.technical_about.section_label IS 'Small label text above heading (e.g., "ABOUT")';
COMMENT ON COLUMN public.technical_about.heading IS 'Main heading text (e.g., "Who Am I?")';
COMMENT ON COLUMN public.technical_about.content_blocks IS 'Array of paragraph text blocks in order';
COMMENT ON COLUMN public.technical_about.stats IS 'Array of stat objects with value and label properties';

-- -----------------------------------------------------------------------------
-- Table: social_links
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type TEXT NOT NULL CHECK (link_type IN ('resume', 'github', 'linkedin', 'twitter', 'telegram')),
  url TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  page_context TEXT NOT NULL CHECK (page_context IN ('about', 'technical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT social_links_page_context_link_type_unique UNIQUE(page_context, link_type)
);

-- -----------------------------------------------------------------------------
-- Table: resume_download_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resume_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_agent TEXT,
  referrer TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 5: INDEXES
-- ============================================================================

-- Photos indexes
CREATE INDEX IF NOT EXISTS idx_photos_z_index ON public.photos(z_index);
CREATE INDEX IF NOT EXISTS idx_photos_is_draft ON public.photos(is_draft);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON public.photos USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_photos_year ON public.photos(year);
CREATE INDEX IF NOT EXISTS idx_photos_visibility ON public.photos(project_visibility);
CREATE INDEX IF NOT EXISTS idx_photos_media_type ON public.photos(media_type);

-- Image versions indexes
CREATE INDEX IF NOT EXISTS idx_image_versions_photo_id ON public.image_versions(photo_id);
CREATE INDEX IF NOT EXISTS idx_image_versions_version ON public.image_versions(photo_id, version_number DESC);

-- Artworks indexes
CREATE INDEX IF NOT EXISTS idx_artworks_is_published ON public.artworks(is_published);
CREATE INDEX IF NOT EXISTS idx_artworks_tags ON public.artworks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_artworks_creation_date ON public.artworks(creation_date);
CREATE INDEX IF NOT EXISTS idx_artworks_z_index ON public.artworks(z_index);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_published ON public.achievements(is_published);
CREATE INDEX IF NOT EXISTS idx_achievements_display_order ON public.achievements(display_order);
CREATE INDEX IF NOT EXISTS idx_achievements_category_order ON public.achievements(category, display_order);

-- Education indexes
CREATE INDEX IF NOT EXISTS idx_education_display_order ON public.education(display_order);

-- Experience indexes
CREATE INDEX IF NOT EXISTS idx_about_experience_display_order ON public.about_experience(display_order);
CREATE INDEX IF NOT EXISTS idx_technical_experience_display_order ON public.technical_experience(display_order);

-- Technical projects indexes
CREATE INDEX IF NOT EXISTS idx_technical_projects_display_order ON public.technical_projects(display_order);
CREATE INDEX IF NOT EXISTS idx_technical_projects_dev_year ON public.technical_projects(dev_year);
CREATE INDEX IF NOT EXISTS idx_technical_projects_progress ON public.technical_projects(progress);

-- Technical skills indexes
CREATE INDEX IF NOT EXISTS idx_technical_skills_order ON public.technical_skills(order_index);
CREATE INDEX IF NOT EXISTS idx_technical_skills_visible ON public.technical_skills(is_visible);

-- Social links indexes
CREATE INDEX IF NOT EXISTS idx_social_links_display_order ON public.social_links(display_order);
CREATE INDEX IF NOT EXISTS idx_social_links_is_visible ON public.social_links(is_visible);
CREATE INDEX IF NOT EXISTS idx_social_links_page_context ON public.social_links(page_context);

-- Resume download logs indexes
CREATE INDEX IF NOT EXISTS idx_resume_download_logs_downloaded_at ON public.resume_download_logs(downloaded_at DESC);

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Trigger on auth.users for auto-assigning roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_first_admin();

-- Trigger on photos
DROP TRIGGER IF EXISTS update_photos_updated_at ON public.photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on artworks
CREATE OR REPLACE FUNCTION public.update_artworks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_artworks_updated_at ON public.artworks;
CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_artworks_updated_at();

-- Trigger on achievements
CREATE OR REPLACE FUNCTION public.update_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_achievements_updated_at();

-- Trigger on hero_text
DROP TRIGGER IF EXISTS update_hero_text_updated_at ON public.hero_text;
CREATE TRIGGER update_hero_text_updated_at
  BEFORE UPDATE ON public.hero_text
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on about_page
DROP TRIGGER IF EXISTS update_about_page_updated_at ON public.about_page;
CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON public.about_page
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on education
DROP TRIGGER IF EXISTS update_education_updated_at ON public.education;
CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON public.education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on about_experience
DROP TRIGGER IF EXISTS update_about_experience_updated_at ON public.about_experience;
CREATE TRIGGER update_about_experience_updated_at
  BEFORE UPDATE ON public.about_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on technical_experience
DROP TRIGGER IF EXISTS update_technical_experience_updated_at ON public.technical_experience;
CREATE TRIGGER update_technical_experience_updated_at
  BEFORE UPDATE ON public.technical_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on technical_projects
DROP TRIGGER IF EXISTS update_technical_projects_updated_at ON public.technical_projects;
CREATE TRIGGER update_technical_projects_updated_at
  BEFORE UPDATE ON public.technical_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on technical_about
DROP TRIGGER IF EXISTS update_technical_about_updated_at ON public.technical_about;
CREATE TRIGGER update_technical_about_updated_at
  BEFORE UPDATE ON public.technical_about
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger on social_links
DROP TRIGGER IF EXISTS update_social_links_updated_at ON public.social_links;
CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_layout_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_about ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_download_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: user_roles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can check their own admin role" ON public.user_roles;
CREATE POLICY "Users can check their own admin role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- RLS Policies: photos
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view photos" ON public.photos;
CREATE POLICY "Anyone can view photos"
  ON public.photos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert photos" ON public.photos;
CREATE POLICY "Admins can insert photos"
  ON public.photos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update photos" ON public.photos;
CREATE POLICY "Admins can update photos"
  ON public.photos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete photos" ON public.photos;
CREATE POLICY "Admins can delete photos"
  ON public.photos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: photo_layout_revisions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view layout revisions" ON public.photo_layout_revisions;
CREATE POLICY "Admins can view layout revisions"
  ON public.photo_layout_revisions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert layout revisions" ON public.photo_layout_revisions;
CREATE POLICY "Admins can insert layout revisions"
  ON public.photo_layout_revisions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete layout revisions" ON public.photo_layout_revisions;
CREATE POLICY "Admins can delete layout revisions"
  ON public.photo_layout_revisions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: image_versions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view image versions" ON public.image_versions;
CREATE POLICY "Anyone can view image versions"
  ON public.image_versions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert image versions" ON public.image_versions;
CREATE POLICY "Admins can insert image versions"
  ON public.image_versions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: artworks
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published artworks" ON public.artworks;
CREATE POLICY "Public can view published artworks"
  ON public.artworks FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin can view all artworks" ON public.artworks;
CREATE POLICY "Admin can view all artworks"
  ON public.artworks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admin can insert artworks" ON public.artworks;
CREATE POLICY "Admin can insert artworks"
  ON public.artworks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admin can update artworks" ON public.artworks;
CREATE POLICY "Admin can update artworks"
  ON public.artworks FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "Admin can delete artworks" ON public.artworks;
CREATE POLICY "Admin can delete artworks"
  ON public.artworks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: achievements
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published achievements" ON public.achievements;
CREATE POLICY "Public can view published achievements"
  ON public.achievements FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin can view all achievements" ON public.achievements;
CREATE POLICY "Admin can view all achievements"
  ON public.achievements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admin can insert achievements" ON public.achievements;
CREATE POLICY "Admin can insert achievements"
  ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Admin can update achievements" ON public.achievements;
CREATE POLICY "Admin can update achievements"
  ON public.achievements FOR UPDATE TO authenticated
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

DROP POLICY IF EXISTS "Admin can delete achievements" ON public.achievements;
CREATE POLICY "Admin can delete achievements"
  ON public.achievements FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor')
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: hero_text
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view hero_text" ON public.hero_text;
CREATE POLICY "Anyone can view hero_text"
  ON public.hero_text FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert hero_text" ON public.hero_text;
CREATE POLICY "Admins can insert hero_text"
  ON public.hero_text FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update hero_text" ON public.hero_text;
CREATE POLICY "Admins can update hero_text"
  ON public.hero_text FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete hero_text" ON public.hero_text;
CREATE POLICY "Admins can delete hero_text"
  ON public.hero_text FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: about_page
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view about_page" ON public.about_page;
CREATE POLICY "Anyone can view about_page"
  ON public.about_page FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert about_page" ON public.about_page;
CREATE POLICY "Admins can insert about_page"
  ON public.about_page FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update about_page" ON public.about_page;
CREATE POLICY "Admins can update about_page"
  ON public.about_page FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete about_page" ON public.about_page;
CREATE POLICY "Admins can delete about_page"
  ON public.about_page FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: education
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access for education" ON public.education;
CREATE POLICY "Allow public read access for education"
  ON public.education FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert for education" ON public.education;
CREATE POLICY "Allow admin insert for education"
  ON public.education FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin update for education" ON public.education;
CREATE POLICY "Allow admin update for education"
  ON public.education FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin delete for education" ON public.education;
CREATE POLICY "Allow admin delete for education"
  ON public.education FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: about_experience
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access for about_experience" ON public.about_experience;
CREATE POLICY "Allow public read access for about_experience"
  ON public.about_experience FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert for about_experience" ON public.about_experience;
CREATE POLICY "Allow admin insert for about_experience"
  ON public.about_experience FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin update for about_experience" ON public.about_experience;
CREATE POLICY "Allow admin update for about_experience"
  ON public.about_experience FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin delete for about_experience" ON public.about_experience;
CREATE POLICY "Allow admin delete for about_experience"
  ON public.about_experience FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: technical_experience
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access for technical_experience" ON public.technical_experience;
CREATE POLICY "Allow public read access for technical_experience"
  ON public.technical_experience FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow admin insert for technical_experience" ON public.technical_experience;
CREATE POLICY "Allow admin insert for technical_experience"
  ON public.technical_experience FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin update for technical_experience" ON public.technical_experience;
CREATE POLICY "Allow admin update for technical_experience"
  ON public.technical_experience FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin delete for technical_experience" ON public.technical_experience;
CREATE POLICY "Allow admin delete for technical_experience"
  ON public.technical_experience FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: technical_projects
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view technical projects" ON public.technical_projects;
CREATE POLICY "Anyone can view technical projects"
  ON public.technical_projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert technical projects" ON public.technical_projects;
CREATE POLICY "Admins can insert technical projects"
  ON public.technical_projects FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update technical projects" ON public.technical_projects;
CREATE POLICY "Admins can update technical projects"
  ON public.technical_projects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete technical projects" ON public.technical_projects;
CREATE POLICY "Admins can delete technical projects"
  ON public.technical_projects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: technical_skills
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view visible technical skills" ON public.technical_skills;
CREATE POLICY "Anyone can view visible technical skills"
  ON public.technical_skills FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can insert technical skills" ON public.technical_skills;
CREATE POLICY "Admins can insert technical skills"
  ON public.technical_skills FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update technical skills" ON public.technical_skills;
CREATE POLICY "Admins can update technical skills"
  ON public.technical_skills FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete technical skills" ON public.technical_skills;
CREATE POLICY "Admins can delete technical skills"
  ON public.technical_skills FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: technical_about
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view technical about section" ON public.technical_about;
CREATE POLICY "Anyone can view technical about section"
  ON public.technical_about FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can insert technical about section" ON public.technical_about;
CREATE POLICY "Admins can insert technical about section"
  ON public.technical_about FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update technical about section" ON public.technical_about;
CREATE POLICY "Admins can update technical about section"
  ON public.technical_about FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete technical about section" ON public.technical_about;
CREATE POLICY "Admins can delete technical about section"
  ON public.technical_about FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- RLS Policies: social_links
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view visible social_links" ON public.social_links;
CREATE POLICY "Anyone can view visible social_links"
  ON public.social_links FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can view all social_links" ON public.social_links;
CREATE POLICY "Admins can view all social_links"
  ON public.social_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert social_links" ON public.social_links;
CREATE POLICY "Admins can insert social_links"
  ON public.social_links FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update social_links" ON public.social_links;
CREATE POLICY "Admins can update social_links"
  ON public.social_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete social_links" ON public.social_links;
CREATE POLICY "Admins can delete social_links"
  ON public.social_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- RLS Policies: resume_download_logs
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert resume_download_logs" ON public.resume_download_logs;
CREATE POLICY "Anyone can insert resume_download_logs"
  ON public.resume_download_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view resume_download_logs" ON public.resume_download_logs;
CREATE POLICY "Admins can view resume_download_logs"
  ON public.resume_download_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- SECTION 8: STORAGE BUCKETS
-- ============================================================================

-- Create photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create technical-projects bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-projects', 'technical-projects', true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Storage Policies: photos bucket
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
CREATE POLICY "Admins can upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update photos" ON storage.objects;
CREATE POLICY "Admins can update photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete photos" ON storage.objects;
CREATE POLICY "Admins can delete photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------------------------------
-- Storage Policies: technical-projects bucket
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view technical project images" ON storage.objects;
CREATE POLICY "Anyone can view technical project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'technical-projects');

DROP POLICY IF EXISTS "Admins can upload technical project images" ON storage.objects;
CREATE POLICY "Admins can upload technical project images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update technical project images" ON storage.objects;
CREATE POLICY "Admins can update technical project images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete technical project images" ON storage.objects;
CREATE POLICY "Admins can delete technical project images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- SECTION 9: SEED DATA
-- ============================================================================

-- Seed hero_text for existing pages
INSERT INTO public.hero_text (page_slug, hero_title, hero_subtitle, hero_description) VALUES
  ('home', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('about', 'Ankur Bag', 'PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.'),
  ('artistic', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('technical', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('photoshoots', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('achievement', 'Achievements', 'AWARDS & RECOGNITIONS', 'Explore achievements across different categories. Hover over each folder to preview certificates.')
ON CONFLICT (page_slug) DO NOTHING;

-- Seed about_page
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
WHERE NOT EXISTS (SELECT 1 FROM public.about_page LIMIT 1);

-- Seed technical_skills (only if table is empty)
INSERT INTO public.technical_skills (category, skills, order_index, is_visible)
SELECT * FROM (VALUES
  ('Frontend', ARRAY['React', 'TypeScript', 'Next.js', 'Vue.js'], 1, true),
  ('Backend', ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB'], 2, true),
  ('Tools', ARRAY['AWS', 'Docker', 'Git', 'Figma'], 3, true),
  ('Specialties', ARRAY['AI/ML', 'Web3', 'Performance', 'Security'], 4, true)
) AS seed_data(category, skills, order_index, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_skills LIMIT 1);

-- Seed technical_about (only if table is empty)
INSERT INTO public.technical_about (
  section_label,
  heading,
  content_blocks,
  stats
)
SELECT
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
WHERE NOT EXISTS (SELECT 1 FROM public.technical_about LIMIT 1);

-- Seed technical_experience (only if table is empty)
INSERT INTO public.technical_experience (role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
SELECT * FROM (VALUES
  ('Website Developer', 'Digital Indian pvt Solution', 'Full-time', '08/2024', NULL::TEXT, true, 1),
  ('Google Map 360 Photographer', 'Instanovate', 'Contract', '02/2025', '03/2025', false, 2),
  ('Cinematography/ Editing', 'Freelance', 'Freelance', '2019', NULL::TEXT, true, 3)
) AS seed_data(role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_experience LIMIT 1);

-- Seed technical_projects (only if table is empty)
INSERT INTO public.technical_projects (
  title,
  description,
  dev_year,
  status,
  languages,
  display_order
)
SELECT * FROM (VALUES
  (
    'AI Analytics Dashboard',
    'Real-time data visualization platform with machine learning insights for enterprise clients.',
    '2024',
    'Live',
    '["React", "TypeScript", "Python", "TensorFlow"]'::jsonb,
    1
  ),
  (
    'Blockchain Wallet',
    'Secure multi-chain cryptocurrency wallet with DeFi integration and advanced security features.',
    '2023',
    'In Development',
    '["Next.js", "Web3", "Solidity", "Node.js"]'::jsonb,
    2
  ),
  (
    'E-commerce Platform',
    'Modern shopping experience with AR try-on features and personalized recommendations.',
    '2023',
    'Live',
    '["Vue.js", "Express", "MongoDB", "AWS"]'::jsonb,
    3
  ),
  (
    'IoT Management System',
    'Comprehensive platform for monitoring and controlling smart devices across multiple locations.',
    '2022',
    'Live',
    '["React Native", "MQTT", "PostgreSQL", "Docker"]'::jsonb,
    4
  )
) AS seed_data(title, description, dev_year, status, languages, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_projects LIMIT 1);

-- Seed social_links for About page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('about', 'resume', '', false, 0),
  ('about', 'github', '', false, 1),
  ('about', 'linkedin', '', false, 2),
  ('about', 'twitter', '', false, 3),
  ('about', 'telegram', '', false, 4)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- Seed social_links for Technical page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('technical', 'github', '', false, 0),
  ('technical', 'linkedin', '', false, 1),
  ('technical', 'twitter', '', false, 2)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- ============================================================================
-- SECTION 10: GRANTS
-- ============================================================================

-- Grant necessary permissions for the trigger to work
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.user_roles TO postgres, service_role;

-- ============================================================================
-- SECTION 11: HELPER FUNCTIONS FOR MIGRATION
-- ============================================================================

-- Function to migrate artistic photos to artworks (if needed)
CREATE OR REPLACE FUNCTION migrate_artistic_photos_to_artworks()
RETURNS TABLE(
  migrated_count INTEGER,
  skipped_count INTEGER,
  total_count INTEGER
) AS $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  -- This function is available if you need to migrate artistic photos
  -- from the old category-based system
  RETURN QUERY SELECT v_migrated_count, v_skipped_count, v_total_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_artistic_photos_to_artworks() IS 'One-time migration function to copy artistic photos to artworks table. Returns counts of migrated, skipped, and total records.';

-- Verification view for artistic migration
CREATE OR REPLACE VIEW artistic_migration_verification AS
SELECT 
  'artworks' AS source_table,
  COUNT(*) AS record_count,
  COUNT(DISTINCT id) AS unique_ids,
  MIN(created_at) AS earliest_date,
  MAX(created_at) AS latest_date
FROM public.artworks;

COMMENT ON VIEW artistic_migration_verification IS 'Verification view to check artworks counts.';

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
-- 
-- Next Steps:
-- 1. Create your first admin user by signing up at /admin/login
-- 2. The first user will automatically get admin role
-- 3. Configure your .env file with Supabase credentials
-- 4. If storage buckets were not created, manually create them in the dashboard
-- 
-- For more details, see SUPABASE_RESTORE_GUIDE.md
-- ============================================================================
