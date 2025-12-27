-- Update experience table schema to match requirements
-- Remove logo_url field and add required fields for experience management

-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS experience CASCADE;

-- Create experience table with correct schema
CREATE TABLE IF NOT EXISTS experience (
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

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_experience_display_order ON experience(display_order);

-- Enable RLS
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access for experience"
  ON experience
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to manage experience
CREATE POLICY "Allow admin insert for experience"
  ON experience
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update for experience"
  ON experience
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete for experience"
  ON experience
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_experience_updated_at
  BEFORE UPDATE ON experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed with existing hardcoded experience data from MinimalAbout.tsx
INSERT INTO experience (role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
VALUES 
  ('Website Developer', 'Digital Indian pvt Solution', 'Full-time', '08/2024', NULL, true, 1),
  ('Google Map 360 Photographer', 'Instanovate', 'Contract', '02/2025', '03/2025', false, 2),
  ('Cinematography/ Editing', 'Freelance', 'Freelance', '2019', NULL, true, 3);

-- Add comments to document the schema
COMMENT ON TABLE experience IS 'Professional experience entries for the Technical Portfolio page';
COMMENT ON COLUMN experience.role_title IS 'Job title/role';
COMMENT ON COLUMN experience.company_name IS 'Company or organization name';
COMMENT ON COLUMN experience.employment_type IS 'Type of employment: Full-time, Freelance, Contract, etc.';
COMMENT ON COLUMN experience.start_date IS 'Start date in MM/YYYY or YYYY format';
COMMENT ON COLUMN experience.end_date IS 'End date in MM/YYYY or YYYY format, NULL for current position';
COMMENT ON COLUMN experience.is_current IS 'Boolean flag indicating if this is a current position';
COMMENT ON COLUMN experience.display_order IS 'Order for displaying experience entries (lower numbers first)';
