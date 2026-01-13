-- =============================================================================
-- RECOVERY MIGRATION: Ensure Core Database Objects Exist
-- =============================================================================
-- This migration is designed to be run after recreating a Supabase project.
-- It ensures all required database objects exist with correct definitions.
-- All statements are idempotent (safe to run multiple times).
-- =============================================================================

-- =============================================================================
-- STEP 1: Create Enum Types (if not exist)
-- =============================================================================

-- Create app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END$$;

-- Create photo_category enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_category') THEN
    CREATE TYPE public.photo_category AS ENUM ('selected', 'commissioned', 'editorial', 'personal');
  END IF;
END$$;

-- =============================================================================
-- STEP 2: Create Core Tables (if not exist)
-- =============================================================================

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 3: Create/Replace Core Functions
-- =============================================================================

-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the has_role function for checking user roles
-- This is a SECURITY DEFINER function to bypass RLS when checking roles
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

-- Create function to handle new user signups
-- First user gets 'admin' role, all subsequent users get 'user' role
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

-- =============================================================================
-- STEP 4: Create/Recreate Triggers
-- =============================================================================

-- Drop and recreate the user signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_first_admin();

-- =============================================================================
-- STEP 5: Create RLS Policies for user_roles (if not exist)
-- =============================================================================

-- Policy: Admins can view all roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can view all roles'
  ) THEN
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;

-- Policy: Users can view their own role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view their own role'
  ) THEN
    CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END$$;

-- =============================================================================
-- STEP 6: Grant Necessary Permissions
-- =============================================================================

-- Grant permissions for user_roles table
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT ON public.user_roles TO postgres, service_role;

-- =============================================================================
-- STEP 7: Backfill Missing User Roles
-- =============================================================================

-- Insert 'user' role for all auth.users who don't have any entry in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================================================
-- STEP 8: Ensure about_page table and policies exist
-- =============================================================================

-- Create about_page table if not exists
CREATE TABLE IF NOT EXISTS public.about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_image_url TEXT,
  bio_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on about_page
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- Create about_page RLS policies (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'about_page' 
    AND policyname = 'Anyone can view about_page'
  ) THEN
    CREATE POLICY "Anyone can view about_page"
    ON public.about_page
    FOR SELECT
    USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'about_page' 
    AND policyname = 'Admins can insert about_page'
  ) THEN
    CREATE POLICY "Admins can insert about_page"
    ON public.about_page
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'about_page' 
    AND policyname = 'Admins can update about_page'
  ) THEN
    CREATE POLICY "Admins can update about_page"
    ON public.about_page
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'about_page' 
    AND policyname = 'Admins can delete about_page'
  ) THEN
    CREATE POLICY "Admins can delete about_page"
    ON public.about_page
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;

-- Create updated_at trigger for about_page
DROP TRIGGER IF EXISTS update_about_page_updated_at ON public.about_page;
CREATE TRIGGER update_about_page_updated_at
BEFORE UPDATE ON public.about_page
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- STEP 9: Seed about_page with default data if empty
-- =============================================================================

INSERT INTO public.about_page (profile_image_url, bio_text, services)
SELECT 
  NULL,
  E'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.\n\nFull production services including art buying, location scouting, casting, and on-set management. Collaborative approach ensuring seamless execution from concept to delivery.',
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
WHERE NOT EXISTS (SELECT 1 FROM public.about_page LIMIT 1);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- After running this migration, ensure that:
-- 1. At least one user exists in auth.users (the admin user)
-- 2. That user has an 'admin' role in user_roles table
-- 3. Test by logging in and checking admin access
-- =============================================================================
