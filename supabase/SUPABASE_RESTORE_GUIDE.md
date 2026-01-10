# Supabase Database Restoration Guide

This guide provides step-by-step instructions to recreate your Supabase project from the existing SQL migrations.

---

## Table of Contents
1. [Required Extensions](#section-1-required-extensions)
2. [Tables & Relationships](#section-2-tables--relationships)
3. [RLS Policies](#section-3-rls-policies)
4. [Storage Buckets Setup](#section-4-storage-buckets-setup)
5. [Final SQL / Migration Order](#section-5-final-sql--migration-order)
6. [Step-by-Step Restore Checklist](#section-6-step-by-step-restore-checklist)

---

## Section 1: Required Extensions

The following PostgreSQL extensions are required:

```sql
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

> **Note:** Most of these extensions are pre-installed in Supabase. The `uuid-ossp` extension is critical for UUID generation.

---

## Section 2: Tables & Relationships

### Enums

| Enum Name | Values |
|-----------|--------|
| `app_role` | `'admin'`, `'user'` |
| `photo_category` | `'selected'`, `'commissioned'`, `'editorial'`, `'personal'`, `'artistic'` |

### Tables Overview

| Table | Description | Foreign Keys |
|-------|-------------|--------------|
| `user_roles` | User role assignments | `user_id` → `auth.users(id)` |
| `photos` | Photoshoot gallery media | None |
| `photo_layout_revisions` | Layout revision history | `created_by` → `auth.users(id)` |
| `image_versions` | Image replacement history | `photo_id` → `photos(id)`, `replaced_by` → `auth.users(id)` |
| `artworks` | Artistic works gallery | None |
| `achievements` | Achievement certificates | None |
| `hero_text` | Dynamic hero sections | None |
| `about_page` | About page content | None |
| `education` | Education entries | None |
| `about_experience` | About page work experience | None |
| `technical_experience` | Technical portfolio experience | None |
| `technical_projects` | Technical projects portfolio | None |
| `technical_skills` | Skills for technical portfolio | None |
| `technical_about` | Technical about section | None |
| `social_links` | Social/professional links | None |
| `resume_download_logs` | Resume download tracking | None |

### Complete Schema Details

#### 1. `user_roles` Table
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

#### 2. `photos` Table
```sql
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- WYSIWYG layout fields
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 300,
  height FLOAT NOT NULL DEFAULT 400,
  scale FLOAT NOT NULL DEFAULT 1.0,
  rotation FLOAT NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Metadata fields
  caption TEXT,
  photographer_name TEXT,
  date_taken DATE,
  device_used TEXT,
  video_thumbnail_url TEXT,
  -- Original file tracking
  original_file_url TEXT,
  original_width INTEGER,
  original_height INTEGER,
  original_mime_type TEXT,
  original_size_bytes BIGINT,
  -- Extended metadata
  year INTEGER,
  tags TEXT[],
  credits TEXT,
  camera_lens TEXT,
  project_visibility TEXT DEFAULT 'public',
  external_links JSONB DEFAULT '[]'::jsonb,
  -- Video support
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  video_duration_seconds NUMERIC,
  video_width INTEGER,
  video_height INTEGER,
  video_url TEXT
);
```
> **Note:** The `category` column was removed in migration `20251227110000`.

#### 3. `photo_layout_revisions` Table
```sql
CREATE TABLE public.photo_layout_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category photo_category NOT NULL,
  revision_name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### 4. `image_versions` Table
```sql
CREATE TABLE public.image_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  original_file_url TEXT,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  size_bytes BIGINT,
  replaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replaced_by UUID REFERENCES auth.users(id),
  notes TEXT
);
```

#### 5. `artworks` Table
```sql
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  creation_date DATE,
  description TEXT,
  dimension_preset TEXT CHECK (dimension_preset IN ('A4', 'A3', 'Custom')),
  custom_width DECIMAL(10, 2),
  custom_height DECIMAL(10, 2),
  dimension_unit TEXT DEFAULT 'cm' CHECK (dimension_unit IN ('cm', 'in', 'mm')),
  pencil_grades TEXT[],
  charcoal_types TEXT[],
  paper_type TEXT,
  time_taken TEXT,
  tags TEXT[] DEFAULT '{}',
  copyright TEXT DEFAULT '© Ankur Bag.',
  primary_image_url TEXT NOT NULL,
  primary_image_original_url TEXT,
  primary_image_width INTEGER,
  primary_image_height INTEGER,
  process_images JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  position_x DECIMAL(10, 2) DEFAULT 0,
  position_y DECIMAL(10, 2) DEFAULT 0,
  width DECIMAL(10, 2) DEFAULT 800,
  height DECIMAL(10, 2) DEFAULT 1000,
  scale DECIMAL(10, 4) DEFAULT 1.0,
  rotation DECIMAL(10, 2) DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  layout_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `achievements` Table
```sql
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('School', 'College', 'National', 'Online Courses', 'Extracurricular', 'Internships')),
  image_url TEXT NOT NULL,
  image_original_url TEXT,
  image_width INTEGER,
  image_height INTEGER,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  external_link TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `hero_text` Table
```sql
CREATE TABLE public.hero_text (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT UNIQUE NOT NULL,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  background_media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT hero_text_page_slug_not_empty CHECK (page_slug <> '')
);
```

#### 8. `about_page` Table
```sql
CREATE TABLE public.about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_image_url TEXT,
  bio_text TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### 9. `education` Table
```sql
CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  start_year TEXT NOT NULL,
  end_year TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. `about_experience` Table
```sql
CREATE TABLE public.about_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 11. `technical_experience` Table
```sql
CREATE TABLE public.technical_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 12. `technical_projects` Table
```sql
CREATE TABLE public.technical_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  github_link TEXT,
  live_link TEXT,
  dev_year TEXT NOT NULL,
  status TEXT DEFAULT 'Live',
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  progress INTEGER DEFAULT NULL CHECK (progress IS NULL OR (progress >= 0 AND progress <= 100)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### 13. `technical_skills` Table
```sql
CREATE TABLE public.technical_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### 14. `technical_about` Table
```sql
CREATE TABLE public.technical_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_label TEXT NOT NULL DEFAULT 'About',
  heading TEXT NOT NULL DEFAULT 'Who Am I?',
  content_blocks JSONB NOT NULL DEFAULT '[]',
  stats JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

#### 15. `social_links` Table
```sql
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_type TEXT NOT NULL CHECK (link_type IN ('resume', 'github', 'linkedin', 'twitter', 'telegram')),
  url TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  page_context TEXT NOT NULL CHECK (page_context IN ('about', 'technical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_context, link_type)
);
```

#### 16. `resume_download_logs` Table
```sql
CREATE TABLE public.resume_download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_agent TEXT,
  referrer TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

---

## Section 3: RLS Policies

### Overview of RLS Patterns

The application uses two main patterns for RLS:

1. **Public Read / Admin Write**: Public users can read, only admins can modify
2. **Admin Only**: Only admins can read and write

### Helper Function

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Tables with RLS Enabled

All tables have RLS enabled. Here are the policy patterns:

| Table | Public Read | Admin Read | Admin Insert | Admin Update | Admin Delete |
|-------|-------------|------------|--------------|--------------|--------------|
| `user_roles` | Own role only | All roles | ✗ | ✗ | ✗ |
| `photos` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `photo_layout_revisions` | ✗ | ✓ | ✓ | ✗ | ✓ |
| `image_versions` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `artworks` | Published only | All | ✓ | ✓ | ✓ |
| `achievements` | Published only | All | ✓ | ✓ | ✓ |
| `hero_text` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `about_page` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `education` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `about_experience` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `technical_experience` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `technical_projects` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `technical_skills` | Visible only | ✓ | ✓ | ✓ | ✓ |
| `technical_about` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `social_links` | Visible only | All | ✓ | ✓ | ✓ |
| `resume_download_logs` | ✗ | ✓ | ✓ (public) | ✗ | ✗ |

---

## Section 4: Storage Buckets Setup

### Buckets Required

| Bucket ID | Bucket Name | Public | Purpose |
|-----------|-------------|--------|---------|
| `photos` | photos | ✓ | Photo gallery images |
| `technical-projects` | technical-projects | ✓ | Project thumbnails |

### Storage Bucket Creation SQL

```sql
-- Create photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create technical-projects bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('technical-projects', 'technical-projects', true)
ON CONFLICT (id) DO NOTHING;
```

### Storage Policies

```sql
-- Photos bucket policies
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Admins can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND public.has_role(auth.uid(), 'admin'));

-- Technical-projects bucket policies
CREATE POLICY "Anyone can view technical project images"
ON storage.objects FOR SELECT USING (bucket_id = 'technical-projects');

CREATE POLICY "Admins can upload technical project images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update technical project images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete technical project images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'technical-projects' AND public.has_role(auth.uid(), 'admin'));
```

---

## Section 5: Final SQL / Migration Order

### Option A: Using Individual Migration Files (Recommended)

Run migrations in the following order:

```
1.  20251208080332_remix_migration_from_pg_dump.sql
2.  20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql
3.  20251208093500_add_auto_user_role_trigger.sql
4.  20251208095404_fix_user_roles_rls_policy.sql
5.  20251208110000_add_photo_layout_fields.sql
6.  20251209055506_32319858-427e-48e6-b222-69ac957fb071.sql
7.  20251209082000_ensure_user_roles_trigger_and_policies.sql
8.  20251209100000_fix_photos_table_schema.sql
9.  20251210065809_90fd4cb7-ca14-44db-afb3-e30202e21f1e.sql
10. 20251210072757_fix_user_roles_trigger_for_all_users.sql
11. 20251210072758_backfill_missing_user_roles.sql
12. 20251210090200_add_photo_metadata_fields.sql
13. 20251212093800_create_technical_projects_table.sql
14. 20251212093801_seed_technical_projects.sql
15. 20251212140000_add_image_originals_and_metadata.sql
16. 20251212140100_create_image_versions_table.sql
17. 20251212140200_extend_photo_category_for_artistic.sql
18. 20251212163000_create_artworks_table.sql
19. 20251212163100_migrate_artistic_photos_to_artworks.sql
20. 20251213210900_create_achievements_table.sql
21. 20251214203549_add_year_to_achievements.sql
22. 20251225194900_create_hero_text_table.sql
23. 20251225210200_create_about_page_table.sql
24. 20251227100000_create_education_experience_tables.sql
25. 20251227110000_remove_photos_category.sql
26. 20251227165000_create_technical_skills_table.sql
27. 20251227185300_update_experience_table_schema.sql
28. 20251227192100_separate_about_and_technical_experience.sql
29. 20251228090000_create_social_links_table.sql
30. 20251228122300_create_technical_about_table.sql
31. 20251228130000_add_technical_social_links.sql
32. 20251228142200_add_progress_to_technical_projects.sql
33. 20251231220000_fix_photos_category_constraint.sql
34. 20260101160000_update_achievement_categories.sql
35. 20260106170000_add_video_media_support.sql
```

### Option B: Using Consolidated init.sql

A consolidated `init.sql` file is provided at `supabase/init.sql` that:
- Creates all extensions
- Creates all enums
- Creates all tables with final schema
- Creates all indexes
- Creates all functions and triggers
- Creates all RLS policies
- Sets up storage buckets
- Seeds initial data

---

## Section 6: Step-by-Step Restore Checklist

### Prerequisites

- [ ] Create a new Supabase project at https://app.supabase.com
- [ ] Get your project credentials:
  - Project Reference ID
  - Supabase URL
  - Anon/Public Key

### Method 1: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Update config.toml with your project ID
# Edit supabase/config.toml and replace "your-project-reference-id-here"

# 3. Login to Supabase
supabase login

# 4. Link to your project
supabase link --project-ref YOUR_PROJECT_REF_ID

# 5. Push migrations
supabase db push

# 6. Verify migration status
supabase migration list
```

### Method 2: Manual SQL Execution

1. [ ] Go to your Supabase project dashboard
2. [ ] Navigate to **SQL Editor**
3. [ ] Run the consolidated `init.sql` file OR run each migration file in order
4. [ ] Verify tables were created in **Table Editor**
5. [ ] Verify storage buckets in **Storage** section

### Method 3: Using `supabase db reset`

If you're setting up a fresh database:

```bash
# This will reset and apply all migrations
supabase db reset
```

### Post-Setup Steps

1. [ ] **Configure Authentication**
   - Go to **Authentication** > **Providers** > **Email**
   - Toggle off **"Confirm email"** for easy testing
   - Click **Save**

2. [ ] **Create Admin User**
   - Sign up through `/admin/login`
   - First user automatically gets admin role
   - Or manually update role:
     ```sql
     UPDATE public.user_roles
     SET role = 'admin'
     WHERE user_id = 'your-user-id-here';
     ```

3. [ ] **Update Environment Variables**
   ```
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
   ```

4. [ ] **Verify Storage Buckets**
   - Go to **Storage** in Supabase dashboard
   - Confirm `photos` bucket exists and is public
   - Confirm `technical-projects` bucket exists and is public

### Troubleshooting

#### Storage Buckets Not Created
Storage bucket creation may fail silently in migrations. Manually create them:
1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Create `photos` bucket with "Public bucket" enabled
4. Create `technical-projects` bucket with "Public bucket" enabled

#### RLS Policy Conflicts
If you get duplicate policy errors, run:
```sql
-- List all policies on a table
SELECT policyname FROM pg_policies WHERE tablename = 'your_table_name';

-- Drop specific policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

#### Extension Errors
Some extensions require superuser privileges. These are typically pre-installed in Supabase:
- `pg_graphql`
- `pg_stat_statements`
- `supabase_vault`

If you get extension errors, skip them as they're already available.

---

## What Will NOT Restore Automatically

⚠️ **Important:** The following require manual setup:

1. **Storage Bucket Files** - Only bucket structure is created, not actual files
2. **User Data** - `auth.users` table is managed by Supabase Auth, not migrations
3. **Environment Variables** - Must be configured in your deployment platform
4. **Email/SMTP Settings** - Configure in Supabase dashboard under Authentication
5. **Edge Functions** - Not part of SQL migrations (if you had any)
6. **Database Webhooks** - Need to be reconfigured manually
7. **Scheduled Jobs (pg_cron)** - Not included in migrations

---

## Folder Structure Verification

Your folder structure should look like:

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # All 35 migration files
│   ├── 20251208080332_remix_migration_from_pg_dump.sql
│   ├── 20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql
│   └── ... (33 more files)
├── init.sql             # Consolidated init script (newly created)
└── SUPABASE_RESTORE_GUIDE.md  # This guide
```

### Compatibility with `supabase db reset`

✅ **Compatible** - All migrations follow Supabase CLI format:
- Migrations are in `supabase/migrations/` directory
- Files are named with timestamp prefix: `YYYYMMDDHHMMSS_*.sql`
- Files are executed in alphabetical order (which matches timestamp order)

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify the migration order
3. Look for duplicate constraint/policy names
4. Ensure extensions are available in your Supabase project

For more information, see the [Supabase CLI documentation](https://supabase.com/docs/reference/cli).
