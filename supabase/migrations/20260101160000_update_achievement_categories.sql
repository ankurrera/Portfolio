-- Migration: Update achievement categories
-- 1. Rename "Extra Curricular" to "Extracurricular"
-- 2. Add new "Internships" category
-- This migration preserves all existing certificates

-- Step 1: Update existing "Extra Curricular" records to "Extracurricular"
UPDATE public.achievements 
SET category = 'Extracurricular' 
WHERE category = 'Extra Curricular';

-- Step 2: Drop the existing constraint
ALTER TABLE public.achievements 
DROP CONSTRAINT IF EXISTS achievements_category_check;

-- Step 3: Add new constraint with updated categories
ALTER TABLE public.achievements 
ADD CONSTRAINT achievements_category_check 
CHECK (category IN ('School', 'College', 'National', 'Online Courses', 'Extracurricular', 'Internships'));

-- Add comment documenting the change
COMMENT ON COLUMN public.achievements.category IS 'Achievement category: School, College, National, Online Courses, Extracurricular (renamed from Extra Curricular), Internships (new)';
