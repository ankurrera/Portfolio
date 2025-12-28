-- Add progress column to technical_projects table
-- Progress is stored as integer (0-100) representing percentage

ALTER TABLE public.technical_projects
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT NULL;

-- Add check constraint to ensure progress is between 0 and 100
ALTER TABLE public.technical_projects
ADD CONSTRAINT progress_range CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100));

-- Add comment to document the column
COMMENT ON COLUMN public.technical_projects.progress IS 'Project completion progress as percentage (0-100). NULL for projects without progress tracking.';

-- Create index for progress queries
CREATE INDEX IF NOT EXISTS idx_technical_projects_progress ON public.technical_projects(progress);
