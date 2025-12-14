-- Add year field to achievements table
-- This migration adds a year field to store the year of achievement

ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add comment
COMMENT ON COLUMN public.achievements.year IS 'Year the achievement was received';
