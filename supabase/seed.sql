-- ============================================================================
-- SUPABASE SEED DATA
-- ============================================================================
-- This file contains initial seed data for the portfolio application.
-- Run this after the database schema has been created.
-- 
-- Usage with Supabase CLI:
-- supabase db reset (will automatically run this after migrations)
-- ============================================================================

-- Seed hero_text for existing pages
INSERT INTO public.hero_text (page_slug, hero_title, hero_subtitle, hero_description) VALUES
  ('home', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('about', 'Ankur Bag', 'PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.'),
  ('artistic', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('technical', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('photoshoots', 'Ankur Bag', 'FASHION PRODUCTION & PHOTOGRAPHY', 'Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications.'),
  ('achievement', 'Achievements', 'AWARDS & RECOGNITIONS', 'Explore achievements across different categories. Hover over each folder to preview certificates.')
ON CONFLICT (page_slug) DO UPDATE SET
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  hero_description = EXCLUDED.hero_description;

-- Seed about_page
INSERT INTO public.about_page (profile_image_url, bio_text, services)
SELECT 
  NULL,
  E'Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery with technical precision and creative vision for global brands and publications.\n\nFull production services including art buying, location scouting, casting, and on-set management. Collaborative approach ensuring seamless execution from concept to delivery.',
  '[
    {"id": "1", "title": "Fashion & Editorial Photography", "description": "High-end fashion and editorial photography for brands and publications"},
    {"id": "2", "title": "Commercial Production", "description": "Full-service commercial photography production"},
    {"id": "3", "title": "Art Buying & Creative Direction", "description": "Professional art buying and creative direction services"},
    {"id": "4", "title": "Location Scouting", "description": "Expert location scouting for perfect shoot environments"},
    {"id": "5", "title": "Casting & Talent Coordination", "description": "Professional casting and talent management"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.about_page LIMIT 1);

-- Seed technical_skills
INSERT INTO public.technical_skills (category, skills, order_index, is_visible)
SELECT * FROM (VALUES
  ('Frontend', ARRAY['React', 'TypeScript', 'Next.js', 'Vue.js'], 1, true),
  ('Backend', ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB'], 2, true),
  ('Tools', ARRAY['AWS', 'Docker', 'Git', 'Figma'], 3, true),
  ('Specialties', ARRAY['AI/ML', 'Web3', 'Performance', 'Security'], 4, true)
) AS v(category, skills, order_index, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_skills LIMIT 1);

-- Seed technical_about
INSERT INTO public.technical_about (section_label, heading, content_blocks, stats)
SELECT
  'About',
  'Who Am I?',
  '[
    "I''m a passionate full-stack Web developer with over 1 year of experience creating digital solutions that matter.",
    "My journey began with a curiosity about how things work. Today, I specialize in building scalable web applications, integrating AI capabilities, and crafting user experiences that feel natural and intuitive.",
    "When I''m not coding, you''ll find me exploring new technologies, contributing to open source projects, or sharing knowledge with the developer community."
  ]'::jsonb,
  '[
    {"value": "10+", "label": "Projects Delivered"},
    {"value": "9+", "label": "Happy Clients"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.technical_about LIMIT 1);

-- Seed technical_experience
INSERT INTO public.technical_experience (role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
SELECT * FROM (VALUES
  ('Website Developer', 'Digital Indian pvt Solution', 'Full-time', '08/2024', NULL::TEXT, true, 1),
  ('Google Map 360 Photographer', 'Instanovate', 'Contract', '02/2025', '03/2025', false, 2),
  ('Cinematography/ Editing', 'Freelance', 'Freelance', '2019', NULL::TEXT, true, 3)
) AS v(role_title, company_name, employment_type, start_date, end_date, is_current, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_experience LIMIT 1);

-- Seed technical_projects
INSERT INTO public.technical_projects (title, description, dev_year, status, languages, display_order)
SELECT * FROM (VALUES
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
  )
) AS v(title, description, dev_year, status, languages, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.technical_projects LIMIT 1);

-- Seed social_links for About page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('about', 'resume', '', false, 0),
  ('about', 'github', '', false, 1),
  ('about', 'linkedin', '', false, 2),
  ('about', 'twitter', '', false, 3),
  ('about', 'telegram', '', false, 4)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- Seed social_links for Technical page
INSERT INTO public.social_links (page_context, link_type, url, is_visible, display_order) VALUES
  ('technical', 'github', '', false, 0),
  ('technical', 'linkedin', '', false, 1),
  ('technical', 'twitter', '', false, 2)
ON CONFLICT (page_context, link_type) DO NOTHING;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
