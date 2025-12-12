-- Seed technical_projects table with existing hardcoded projects from MinimalProjects.tsx
-- These are the 4 projects currently displayed on the Technical page

INSERT INTO public.technical_projects (
  title,
  description,
  dev_year,
  status,
  languages,
  display_order
) VALUES
(
  'AI Analytics Dashboard',
  'Real-time data visualization platform with machine learning insights for enterprise clients.',
  '2024',
  'Live',
  '["React", "TypeScript", "Python", "TensorFlow"]'::jsonb,
  1
),
(
  'Blockchain Wallet',
  'Secure multi-chain cryptocurrency wallet with DeFi integration and advanced security features.',
  '2023',
  'In Development',
  '["Next.js", "Web3", "Solidity", "Node.js"]'::jsonb,
  2
),
(
  'E-commerce Platform',
  'Modern shopping experience with AR try-on features and personalized recommendations.',
  '2023',
  'Live',
  '["Vue.js", "Express", "MongoDB", "AWS"]'::jsonb,
  3
),
(
  'IoT Management System',
  'Comprehensive platform for monitoring and controlling smart devices across multiple locations.',
  '2022',
  'Live',
  '["React Native", "MQTT", "PostgreSQL", "Docker"]'::jsonb,
  4
);
