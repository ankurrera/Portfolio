# Experience Update Fix Summary

## Problem
The admin dashboard was showing errors when trying to update experience data from the About page:
```
index-BO-Zr_dD.js:372 Error saving experience: Object
index-BO-Zr_dD.js:372 Error saving about data: Object
```

## Root Cause
The `experience` table had conflicting schemas due to two different migrations:

1. **About Page Experience** (migration `20251227100000_create_education_experience_tables.sql`):
   - Fields: `logo_url`, `company_name`, `role`, `start_date`, `end_date`, `display_order`
   - Used by About page to display creative/photography work experience

2. **Technical Portfolio Experience** (migration `20251227185300_update_experience_table_schema.sql`):
   - Fields: `role_title`, `company_name`, `employment_type`, `start_date`, `end_date`, `is_current`, `display_order`
   - Used by Technical Portfolio page to display professional work experience

The later migration dropped and recreated the `experience` table with a different schema, breaking the About page functionality.

## Solution
Created **two separate tables** to avoid conflicts:

### 1. `about_experience` Table
- **Purpose**: Store creative/photography work experience for the About page
- **Schema**:
  ```sql
  id UUID PRIMARY KEY
  logo_url TEXT NOT NULL
  company_name TEXT NOT NULL
  role TEXT NOT NULL
  start_date TEXT NOT NULL (format: "YYYY-MM")
  end_date TEXT (format: "YYYY-MM" or NULL)
  display_order INTEGER NOT NULL
  created_at TIMESTAMP WITH TIME ZONE
  updated_at TIMESTAMP WITH TIME ZONE
  ```
- **Used by**:
  - `src/pages/AdminAboutEdit.tsx` (admin management)
  - `src/pages/About.tsx` (public display)

### 2. `technical_experience` Table
- **Purpose**: Store professional technical work experience for Technical Portfolio
- **Schema**:
  ```sql
  id UUID PRIMARY KEY
  role_title TEXT NOT NULL
  company_name TEXT NOT NULL
  employment_type TEXT (Full-time/Freelance/Contract)
  start_date TEXT NOT NULL (format: "MM/YYYY" or "YYYY")
  end_date TEXT (format: "MM/YYYY" or "YYYY" or NULL)
  is_current BOOLEAN DEFAULT FALSE
  display_order INTEGER NOT NULL
  created_at TIMESTAMP WITH TIME ZONE
  updated_at TIMESTAMP WITH TIME ZONE
  ```
- **Used by**:
  - `src/pages/AdminExperienceEdit.tsx` (admin management)
  - `src/components/admin/ExperienceForm.tsx` (admin form)
  - `src/components/MinimalAbout.tsx` (public display on Technical Portfolio)

## Files Changed

### Database Migration
- **New**: `supabase/migrations/20251227192100_separate_about_and_technical_experience.sql`
  - Creates `about_experience` table
  - Creates `technical_experience` table
  - Sets up RLS policies for both tables
  - Seeds `technical_experience` with existing data

### TypeScript Types
- **Modified**: `src/types/about.ts`
  - Added `AboutExperience` interface
  - Kept `Experience` as alias for backward compatibility

- **Modified**: `src/types/experience.ts`
  - Renamed to `TechnicalExperience` interface
  - Kept `Experience` as alias for backward compatibility

### Component Updates
- **Modified**: `src/pages/AdminAboutEdit.tsx`
  - Changed from `experience` to `about_experience` table
  - All CRUD operations now use the correct table

- **Modified**: `src/pages/About.tsx`
  - Changed from `experience` to `about_experience` table
  - Displays creative work experience

- **Modified**: `src/pages/AdminExperienceEdit.tsx`
  - Changed from `experience` to `technical_experience` table
  - Manages professional technical experience

- **Modified**: `src/components/admin/ExperienceForm.tsx`
  - Changed from `experience` to `technical_experience` table
  - Form for technical experience entries

- **Modified**: `src/components/MinimalAbout.tsx`
  - Changed from `experience` to `technical_experience` table
  - Displays professional technical experience

## Testing Instructions

### 1. Apply Database Migration
```bash
# The migration will be applied automatically on next deployment
# Or manually run:
npx supabase migration up
```

### 2. Test About Page Experience Management
1. Log in to admin dashboard
2. Navigate to "About Page Management"
3. Scroll to "Experience" section
4. Click "Add Experience"
5. Fill in:
   - Upload a logo
   - Company Name (e.g., "Creative Studio")
   - Role (e.g., "Lead Photographer")
   - Start Date (e.g., "2020-01")
   - End Date (e.g., "2023-12" or leave empty for current)
6. Click "Save Changes"
7. Verify no errors appear
8. Check that the experience appears on the public About page

### 3. Test Technical Portfolio Experience Management
1. Log in to admin dashboard
2. Navigate to "Experience Management"
3. Click "Add New Experience"
4. Fill in:
   - Role Title (e.g., "Senior Developer")
   - Company Name (e.g., "Tech Corp")
   - Employment Type (e.g., "Full-time")
   - Start Date (e.g., "01/2020")
   - End Date (e.g., "12/2023" or check "Currently Working Here")
5. Click "Create Experience"
6. Verify no errors appear
7. Check that the experience appears on the Technical Portfolio page

### 4. Verify Data Separation
- About page experience should show creative/photography roles with logos
- Technical Portfolio should show professional technical roles with employment types
- Changes to one should not affect the other

## Build Verification
✅ Project builds successfully with no TypeScript errors
✅ No new linting errors introduced
✅ All imports and references updated correctly

## Notes
- Both tables have proper RLS (Row Level Security) policies
- Only authenticated admins can manage experience data
- Public users can read all experience data
- The migration preserves existing technical experience data
- About experience needs to be manually re-entered (if any existed before)
