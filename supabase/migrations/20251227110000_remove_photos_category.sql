-- Remove category column from photos table
-- This makes photoshoots a unified page without categories

-- Drop the category column
ALTER TABLE photos DROP COLUMN IF EXISTS category;

-- Note: RLS policies that referenced category will automatically
-- work without it since they just check admin status and is_draft
