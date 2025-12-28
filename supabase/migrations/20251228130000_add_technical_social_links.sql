-- Add page context to social_links table to support multiple pages
-- This allows reusing the same table for both About and Technical pages

-- Step 1: Add page_context column (nullable initially for existing rows)
ALTER TABLE public.social_links 
ADD COLUMN page_context TEXT;

-- Step 2: Update existing rows to be 'about' page context
UPDATE public.social_links 
SET page_context = 'about' 
WHERE page_context IS NULL;

-- Step 3: Make page_context NOT NULL and add constraint
ALTER TABLE public.social_links 
ALTER COLUMN page_context SET NOT NULL,
ADD CONSTRAINT social_links_page_context_check 
  CHECK (page_context IN ('about', 'technical'));

-- Step 4: Update unique constraint to include page_context
ALTER TABLE public.social_links 
DROP CONSTRAINT IF EXISTS social_links_link_type_key;

ALTER TABLE public.social_links 
ADD CONSTRAINT social_links_page_context_link_type_unique 
  UNIQUE(page_context, link_type);

-- Step 5: Create index for better query performance
CREATE INDEX idx_social_links_page_context ON public.social_links(page_context);

-- Step 6: Seed initial data for Technical page (github, linkedin, twitter only)
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('technical', 'github', '', false, 0),
  ('technical', 'linkedin', '', false, 1),
  ('technical', 'twitter', '', false, 2)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- Step 7: Update RLS policies to work with page_context
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view visible social_links" ON public.social_links;
DROP POLICY IF EXISTS "Admins can view all social_links" ON public.social_links;
DROP POLICY IF EXISTS "Admins can insert social_links" ON public.social_links;
DROP POLICY IF EXISTS "Admins can update social_links" ON public.social_links;
DROP POLICY IF EXISTS "Admins can delete social_links" ON public.social_links;

-- Recreate policies (same logic but now works with page_context)
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
