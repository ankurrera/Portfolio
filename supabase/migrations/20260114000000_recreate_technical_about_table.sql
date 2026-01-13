-- =============================================================================
-- RECOVERY MIGRATION: Recreate Technical About Table
-- =============================================================================
-- This migration recreates the technical_about table that was accidentally deleted.
-- It is designed to be idempotent (safe to run multiple times).
-- 
-- Table Purpose: Stores the "About Section" content for the Technical Portfolio page
-- 
-- Frontend Requirements:
--   - section_label: Small label text above heading (e.g., "ABOUT")
--   - heading: Main heading text (e.g., "Who Am I?")
--   - content_blocks: Array of paragraphs in order (drag & drop supported)
--   - stats: Array of { value, label } objects for key statistics
--
-- Design Decision: JSONB columns for content_blocks and stats
--   Rationale: 
--   - Single record table (not multiple pages)
--   - Order preservation is built into JSONB arrays
--   - Simpler queries for React consumption (no joins needed)
--   - Atomic updates for drag & drop reordering
--   - Better performance for read-heavy workload
--   - Frontend already expects JSON-like structures
-- =============================================================================

-- =============================================================================
-- STEP 1: Create the technical_about table (if not exists)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.technical_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_label TEXT NOT NULL DEFAULT 'About',
  heading TEXT NOT NULL DEFAULT 'Who Am I?',
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments to document the schema
COMMENT ON TABLE public.technical_about IS 'About section content for Technical Portfolio page. Single row table.';
COMMENT ON COLUMN public.technical_about.section_label IS 'Small label text above heading (e.g., "ABOUT")';
COMMENT ON COLUMN public.technical_about.heading IS 'Main heading text (e.g., "Who Am I?")';
COMMENT ON COLUMN public.technical_about.content_blocks IS 'JSONB array of paragraph text strings. Order is preserved for drag/drop.';
COMMENT ON COLUMN public.technical_about.stats IS 'JSONB array of stat objects: [{ "value": "10+", "label": "Projects Delivered" }]';

-- =============================================================================
-- STEP 2: Enable Row Level Security
-- =============================================================================

ALTER TABLE public.technical_about ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 3: Create RLS Policies (idempotent - check if exists first)
-- =============================================================================

-- Policy: Public users can SELECT (read) the about section
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'technical_about' 
    AND policyname = 'Anyone can view technical about section'
  ) THEN
    CREATE POLICY "Anyone can view technical about section"
    ON public.technical_about
    FOR SELECT
    TO public
    USING (true);
  END IF;
END$$;

-- Policy: Only admins can INSERT new records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'technical_about' 
    AND policyname = 'Admins can insert technical about section'
  ) THEN
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
  END IF;
END$$;

-- Policy: Only admins can UPDATE records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'technical_about' 
    AND policyname = 'Admins can update technical about section'
  ) THEN
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
  END IF;
END$$;

-- Policy: Only admins can DELETE records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'technical_about' 
    AND policyname = 'Admins can delete technical about section'
  ) THEN
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
  END IF;
END$$;

-- =============================================================================
-- STEP 4: Create trigger for updated_at timestamp
-- =============================================================================

-- Drop existing trigger if it exists (to ensure clean state)
DROP TRIGGER IF EXISTS update_technical_about_updated_at ON public.technical_about;

-- Create the trigger (requires update_updated_at_column function to exist)
-- This function is created in 20260113190000_ensure_core_database_objects.sql
CREATE TRIGGER update_technical_about_updated_at
  BEFORE UPDATE ON public.technical_about
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- STEP 5: Create helper index for performance (optional but recommended)
-- =============================================================================

-- Index on id for fast lookups (already covered by PRIMARY KEY)
-- No additional indexes needed for single-row table

-- =============================================================================
-- STEP 6: Seed initial data (only if table is empty)
-- =============================================================================

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

-- =============================================================================
-- STEP 7: Grant permissions
-- =============================================================================

-- Grant SELECT to all roles (public can read)
GRANT SELECT ON public.technical_about TO anon, authenticated;

-- Grant full CRUD to service_role (for backend operations)
GRANT ALL ON public.technical_about TO service_role;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- 
-- HOW FRONTEND SHOULD QUERY THIS DATA:
-- 
-- 1. Public Portfolio Page (read-only):
--    const { data, error } = await supabase
--      .from('technical_about')
--      .select('*')
--      .single();
--    
--    Returns: { id, section_label, heading, content_blocks, stats, created_at, updated_at }
--    content_blocks: string[] - Array of paragraph text
--    stats: { value: string, label: string }[] - Array of stat objects
--
-- 2. Admin Dashboard (CRUD operations):
--    - SELECT: Same as above
--    - INSERT: await supabase.from('technical_about').insert({ section_label, heading, content_blocks, stats })
--    - UPDATE: await supabase.from('technical_about').update({ ... }).eq('id', id)
--    - DELETE: await supabase.from('technical_about').delete().eq('id', id)
--
-- TypeScript Types (already in src/types/technicalAbout.ts):
--    interface TechnicalAboutStat { value: string; label: string; }
--    interface TechnicalAbout {
--      id: string;
--      section_label: string;
--      heading: string;
--      content_blocks: string[];
--      stats: TechnicalAboutStat[];
--      created_at?: string;
--      updated_at?: string;
--    }
-- =============================================================================
