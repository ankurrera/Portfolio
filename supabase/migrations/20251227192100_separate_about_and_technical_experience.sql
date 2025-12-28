-- Separate about experience and technical experience tables
-- This migration fixes the conflict between About page and Technical Portfolio experience data

-- First, backup any existing data from experience table
CREATE TEMP TABLE experience_backup AS
SELECT * FROM experience;

-- Drop the current experience table
DROP TABLE IF EXISTS experience CASCADE;

-- Create about_experience table for the About page
CREATE TABLE IF NOT EXISTS about_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TEXT NOT NULL, -- Format: "YYYY-MM"
  end_date TEXT, -- Format: "YYYY-MM" or NULL for current position
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technical_experience table for the Technical Portfolio page
CREATE TABLE IF NOT EXISTS technical_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT, -- Optional: Full-time / Freelance / Contract
  start_date TEXT NOT NULL, -- Format: "MM/YYYY" or "YYYY-MM"
  end_date TEXT, -- Format: "MM/YYYY" or "YYYY-MM" or NULL for current position
  is_current BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ordering
CREATE INDEX IF NOT EXISTS idx_about_experience_display_order ON about_experience(display_order);
CREATE INDEX IF NOT EXISTS idx_technical_experience_display_order ON technical_experience(display_order);

-- Enable RLS
ALTER TABLE about_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_experience ENABLE ROW LEVEL SECURITY;

-- Allow public read access for about_experience
CREATE POLICY "Allow public read access for about_experience"
  ON about_experience
  FOR SELECT
  TO public
  USING (true);

-- Allow public read access for technical_experience
CREATE POLICY "Allow public read access for technical_experience"
  ON technical_experience
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to manage about_experience
CREATE POLICY "Allow admin insert for about_experience"
  ON about_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for about_experience"
  ON about_experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for about_experience"
  ON about_experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow authenticated admins to manage technical_experience
CREATE POLICY "Allow admin insert for technical_experience"
  ON technical_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for technical_experience"
  ON technical_experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for technical_experience"
  ON technical_experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_about_experience_updated_at
  BEFORE UPDATE ON about_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_experience_updated_at
  BEFORE UPDATE ON technical_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed technical_experience with existing hardcoded data from MinimalAbout.tsx
INSERT INTO technical_experience (role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
VALUES 
  ('Website Developer', 'Digital Indian pvt Solution', 'Full-time', '08/2024', NULL, true, 1),
  ('Google Map 360 Photographer', 'Instanovate', 'Contract', '02/2025', '03/2025', false, 2),
  ('Cinematography/ Editing', 'Freelance', 'Freelance', '2019', NULL, true, 3);

-- Add comments to document the schema
COMMENT ON TABLE about_experience IS 'Work experience entries for the About page (photography/creative work)';
COMMENT ON COLUMN about_experience.logo_url IS 'URL to company/organization logo image';
COMMENT ON COLUMN about_experience.company_name IS 'Company or organization name';
COMMENT ON COLUMN about_experience.role IS 'Job title/role or work done';
COMMENT ON COLUMN about_experience.start_date IS 'Start date in YYYY-MM format';
COMMENT ON COLUMN about_experience.end_date IS 'End date in YYYY-MM format, NULL for current position';
COMMENT ON COLUMN about_experience.display_order IS 'Order for displaying experience entries (lower numbers first)';

COMMENT ON TABLE technical_experience IS 'Professional experience entries for the Technical Portfolio page';
COMMENT ON COLUMN technical_experience.role_title IS 'Job title/role';
COMMENT ON COLUMN technical_experience.company_name IS 'Company or organization name';
COMMENT ON COLUMN technical_experience.employment_type IS 'Type of employment: Full-time, Freelance, Contract, etc.';
COMMENT ON COLUMN technical_experience.start_date IS 'Start date in MM/YYYY or YYYY format';
COMMENT ON COLUMN technical_experience.end_date IS 'End date in MM/YYYY or YYYY format, NULL for current position';
COMMENT ON COLUMN technical_experience.is_current IS 'Boolean flag indicating if this is a current position';
COMMENT ON COLUMN technical_experience.display_order IS 'Order for displaying experience entries (lower numbers first)';
