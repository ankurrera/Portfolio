-- Create table for technical projects
CREATE TABLE public.technical_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Development',
  github_link TEXT,
  live_link TEXT,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.technical_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can view published projects" 
ON public.technical_projects 
FOR SELECT 
USING (is_published = true);

-- Create policies for admin access
CREATE POLICY "Admins can view all projects" 
ON public.technical_projects 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert projects" 
ON public.technical_projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update projects" 
ON public.technical_projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete projects" 
ON public.technical_projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_technical_projects_updated_at
BEFORE UPDATE ON public.technical_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the existing hardcoded projects
INSERT INTO public.technical_projects (title, description, tech_stack, year, status, display_order, is_published)
VALUES 
  ('AI Analytics Dashboard', 'Real-time data visualization platform with machine learning insights for enterprise clients.', ARRAY['React', 'TypeScript', 'Python', 'TensorFlow'], '2024', 'Live', 0, true),
  ('Blockchain Wallet', 'Secure multi-chain cryptocurrency wallet with DeFi integration and advanced security features.', ARRAY['Next.js', 'Web3', 'Solidity', 'Node.js'], '2023', 'In Development', 1, true),
  ('E-commerce Platform', 'Modern shopping experience with AR try-on features and personalized recommendations.', ARRAY['Vue.js', 'Express', 'MongoDB', 'AWS'], '2023', 'Live', 2, true),
  ('IoT Management System', 'Comprehensive platform for monitoring and controlling smart devices across multiple locations.', ARRAY['React Native', 'MQTT', 'PostgreSQL', 'Docker'], '2022', 'Live', 3, true);