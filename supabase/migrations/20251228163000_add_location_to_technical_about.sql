-- Add location and coordinates fields to technical_about table
-- These fields will be used by the LocationMap component

ALTER TABLE public.technical_about 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Kolkata, WB',
ADD COLUMN IF NOT EXISTS coordinates TEXT DEFAULT '22.5726° N, 88.3639° E';

-- Add comments to document the new columns
COMMENT ON COLUMN public.technical_about.location IS 'Location text displayed in the LocationMap component (e.g., "Kolkata, WB", "India")';
COMMENT ON COLUMN public.technical_about.coordinates IS 'Coordinates text displayed when LocationMap is expanded (e.g., "22.5726° N, 88.3639° E")';

-- Update the existing record with location data
UPDATE public.technical_about
SET location = 'Kolkata, WB',
    coordinates = '22.5726° N, 88.3639° E'
WHERE location IS NULL;
