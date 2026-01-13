-- =============================================================================
-- FIX MIGRATION: Correct Broken RLS Policies for technical_skills Table
-- =============================================================================
-- This migration fixes the RLS policy evaluation issues for the technical_skills
-- table that were causing 42501 (row-level security violation) errors.
--
-- ROOT CAUSES OF ORIGINAL POLICY FAILURES:
-- 1. UPDATE policy was missing WITH CHECK clause - PostgreSQL requires both
--    USING (for selecting rows to update) and WITH CHECK (for validating new
--    row values after update). Without WITH CHECK, all updates were rejected.
-- 2. SELECT policy only allowed viewing is_visible=true rows, preventing admins
--    from seeing hidden rows they need to manage.
-- 3. Policies relied on public.has_role() function which may not exist or work
--    correctly after Supabase project recreation.
--
-- SOLUTION:
-- - Drop existing broken policies
-- - Create new policies with inline EXISTS subqueries for admin checks
-- - Add proper WITH CHECK clauses for INSERT and UPDATE operations
-- - Add separate admin SELECT policy to view all rows
-- =============================================================================

-- =============================================================================
-- STEP 1: Ensure the has_role function exists and works correctly
-- =============================================================================
-- This function is used by many tables, so we ensure it exists with correct
-- SECURITY DEFINER to bypass RLS when checking roles

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

-- =============================================================================
-- STEP 2: Ensure user_roles table has proper policies for the has_role function
-- =============================================================================
-- The has_role function is SECURITY DEFINER, so it bypasses RLS.
-- But we need to ensure the user_roles table exists and has data.

-- Backfill any missing user roles for existing auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================================================
-- STEP 3: Drop existing broken policies for technical_skills
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view visible technical skills" ON public.technical_skills;
DROP POLICY IF EXISTS "Admins can view all technical skills" ON public.technical_skills;
DROP POLICY IF EXISTS "Admins can insert technical skills" ON public.technical_skills;
DROP POLICY IF EXISTS "Admins can update technical skills" ON public.technical_skills;
DROP POLICY IF EXISTS "Admins can delete technical skills" ON public.technical_skills;

-- =============================================================================
-- STEP 4: Create corrected RLS policies
-- =============================================================================

-- Policy: Public can view visible skills (for unauthenticated users and general access)
CREATE POLICY "Anyone can view visible technical skills"
ON public.technical_skills
FOR SELECT
USING (is_visible = true);

-- Policy: Admins can view ALL skills (including hidden ones for management)
CREATE POLICY "Admins can view all technical skills"
ON public.technical_skills
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Policy: Admins can insert skills (WITH CHECK is required for INSERT)
CREATE POLICY "Admins can insert technical skills"
ON public.technical_skills
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Policy: Admins can update skills (BOTH USING and WITH CHECK are required)
-- USING: which rows can be selected for update
-- WITH CHECK: what the new row values must satisfy after update
CREATE POLICY "Admins can update technical skills"
ON public.technical_skills
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- Policy: Admins can delete skills
CREATE POLICY "Admins can delete technical skills"
ON public.technical_skills
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
);

-- =============================================================================
-- STEP 5: Grant necessary permissions
-- =============================================================================

-- Ensure authenticated users can access the table (RLS will control row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_skills TO authenticated;
GRANT SELECT ON public.technical_skills TO anon;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- After running this migration:
-- 1. Ensure at least one user has admin role in user_roles table
-- 2. Admin can now SELECT all rows (including hidden), INSERT, UPDATE, DELETE
-- 3. Public users can only SELECT rows where is_visible = true
-- 4. No more 42501 (RLS violation) errors for admin operations
-- =============================================================================
