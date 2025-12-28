# Technical Projects Admin Implementation

## Overview
This document describes the implementation of the Admin Dashboard section for managing Technical Projects. The feature allows administrators to manage technical portfolio projects with full CRUD capabilities, similar to the existing Photoshoots admin section.

## Features Implemented

### 1. Database Schema
**Migration**: `supabase/migrations/20251212093800_create_technical_projects_table.sql`

Created `technical_projects` table with the following structure:
- `id` (UUID): Primary key
- `title` (TEXT): Project name/title
- `description` (TEXT): Project description
- `thumbnail_url` (TEXT): Optional project image/thumbnail
- `github_link` (TEXT): GitHub repository URL
- `live_link` (TEXT): Live demo/project URL
- `dev_year` (TEXT): Development year
- `status` (TEXT): Project status (e.g., "Live", "In Development")
- `languages` (JSONB): Array of programming languages/technologies
- `display_order` (INTEGER): For custom ordering
- `created_at`, `updated_at`: Timestamps

**Row Level Security (RLS) Policies**:
- Public read access for all projects
- Admin-only access for INSERT, UPDATE, DELETE operations

**Storage Bucket**: `technical-projects`
- Created for storing project thumbnails/images
- Same RLS policies as the table

### 2. Data Migration
**Migration**: `supabase/migrations/20251212093801_seed_technical_projects.sql`

Seeded the database with the 4 existing hardcoded projects from `MinimalProjects.tsx`:
1. AI Analytics Dashboard (2024)
2. Blockchain Wallet (2023)
3. E-commerce Platform (2023)
4. IoT Management System (2022)

### 3. TypeScript Types
**File**: `src/types/technical.ts`

Defined comprehensive TypeScript interfaces:
- `TechnicalProject`: Full project data structure
- `TechnicalProjectInsert`: For creating new projects
- `TechnicalProjectUpdate`: For updating existing projects

**Updated**: `src/integrations/supabase/types.ts`
- Added `technical_projects` table definitions for Row, Insert, and Update types

### 4. Admin Components

#### a. TechnicalProjectForm Component
**File**: `src/components/admin/TechnicalProjectForm.tsx`

Full-featured form for creating/editing projects with:
- Title and description fields
- Development year and status
- GitHub and Live link inputs
- Thumbnail image uploader (with Supabase storage integration)
- Tag/language management system (add/remove dynamically)
- Form validation
- Loading states for uploads and saves
- Success/error toast notifications

#### b. TechnicalProjectList Component
**File**: `src/components/admin/TechnicalProjectList.tsx`

Project list with management features:
- Drag-and-drop reordering capability
- Visual project cards with thumbnails
- Edit and delete buttons per project
- Confirmation dialog for deletions
- Displays all project metadata (title, description, year, status, links, languages)
- Responsive grid layout

#### c. AdminTechnicalEdit Page
**File**: `src/pages/AdminTechnicalEdit.tsx`

Main admin page for technical projects:
- Authentication/authorization checks
- Loading states
- Toggle between list view and form view
- Handles all CRUD operations:
  - Create new projects
  - Read/display projects
  - Update existing projects
  - Delete projects
  - Reorder projects (updates `display_order`)
- Breadcrumb navigation back to dashboard
- Real-time data synchronization with Supabase

### 5. Dashboard Integration
**Updated**: `src/pages/AdminDashboard.tsx`

Added new "Technical Projects" section:
- New section with Code2 icon
- Card for "Technical Portfolio"
- Click-through to `/admin/technical/edit`
- Consistent styling with Photoshoots section

### 6. Routing
**Updated**: `src/App.tsx`

Added new route:
```tsx
<Route path="/admin/technical/edit" element={<AdminTechnicalEdit />} />
```

### 7. Public Page Integration
**Updated**: `src/components/MinimalProjects.tsx`

Converted from hardcoded data to dynamic database-driven:
- Fetches projects from Supabase `technical_projects` table
- Ordered by `display_order` field
- Loading state while fetching
- Empty state when no projects exist
- Properly parses JSONB languages array
- Dynamic project numbering
- Functional GitHub and Live link buttons
- Maintains all original animations and styling

## How to Use

### For Administrators

1. **Access Admin Dashboard**
   - Navigate to `/admin/login`
   - Sign in with admin credentials
   - Click on "Technical Portfolio" card in the dashboard

2. **Create a New Project**
   - Click "New Project" button
   - Fill in all required fields (title, description, dev year)
   - Optionally add GitHub link, live link, status
   - Upload a thumbnail image (optional)
   - Add languages/technologies by typing and clicking the "+" button
   - Click "Create Project"

3. **Edit a Project**
   - Click the edit icon (pencil) on any project
   - Modify any fields as needed
   - Click "Update Project"

4. **Delete a Project**
   - Click the delete icon (trash) on any project
   - Confirm deletion in the dialog

5. **Reorder Projects**
   - Drag and drop projects using the grip handle
   - Order is automatically saved to the database
   - Public page will reflect the new order immediately

### For Developers

#### Running Migrations
```bash
# Apply migrations to your Supabase project
supabase db push

# Or if using Supabase CLI locally
supabase migration up
```

#### Database Access
All queries use the Supabase client with proper RLS policies:
- Admins need to be authenticated with `admin` role in `user_roles` table
- Public users can only read published projects

#### Environment Variables Required
```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Technical Details

### Language Storage
Languages are stored as JSONB arrays in the database:
```json
["React", "TypeScript", "Python", "TensorFlow"]
```

They are parsed to JavaScript arrays when retrieved and displayed as tags in the UI.

### Image Upload Flow
1. Admin selects image file (max 5MB)
2. File is validated (type and size)
3. Uploaded to Supabase Storage bucket `technical-projects`
4. Public URL is generated and stored in `thumbnail_url` field
5. Image is displayed in preview

### Drag-and-Drop Reordering
1. User drags a project card
2. Cards reorder visually (optimistic update)
3. `display_order` is recalculated for all projects
4. Individual UPDATE queries sent to Supabase
5. If error occurs, data is reloaded from database

## Screenshots

### Public Technical Page (No Database Connection)
![Technical Public Page](https://github.com/user-attachments/assets/1f63b4fd-b9ff-4fb0-9d8d-32ea4bef7e11)

*Shows the "No projects available yet" state when database is not accessible*

### Admin Login
![Admin Login](https://github.com/user-attachments/assets/be96b21d-cde5-42e5-8e50-f5916e314503)

## Testing Checklist

### Database
- [x] Migration creates `technical_projects` table
- [x] Migration creates `technical-projects` storage bucket
- [x] RLS policies allow public read access
- [x] RLS policies restrict write access to admins only
- [x] Seed migration populates initial data
- [x] TypeScript types match database schema

### Admin CRUD Operations
- [ ] Create: New project can be created with all fields
- [ ] Read: Projects load and display correctly
- [ ] Update: Existing project can be edited
- [ ] Delete: Project can be deleted with confirmation
- [ ] Reorder: Drag-and-drop updates display_order

### Admin UI
- [ ] Technical section appears in Admin Dashboard
- [ ] Form validation works (required fields)
- [ ] Thumbnail upload works (file type, size validation)
- [ ] Image preview displays after upload
- [ ] Tags can be added and removed
- [ ] GitHub/Live links are validated
- [ ] Toast notifications appear on success/error
- [ ] Loading states show during async operations

### Public Page
- [ ] Projects load from database
- [ ] Projects display in correct order (by display_order)
- [ ] All metadata displays correctly
- [ ] GitHub and Live icons link correctly
- [ ] Languages/technologies display as tags
- [ ] Project numbering is sequential
- [ ] Animations work as expected

### Security
- [ ] Non-admin users cannot access admin pages
- [ ] Unauthenticated users redirected to login
- [ ] RLS policies prevent unauthorized database access
- [ ] Image uploads restricted to admins only

## Files Changed/Created

### Created Files
1. `supabase/migrations/20251212093800_create_technical_projects_table.sql`
2. `supabase/migrations/20251212093801_seed_technical_projects.sql`
3. `src/types/technical.ts`
4. `src/components/admin/TechnicalProjectForm.tsx`
5. `src/components/admin/TechnicalProjectList.tsx`
6. `src/pages/AdminTechnicalEdit.tsx`

### Modified Files
1. `src/integrations/supabase/types.ts` - Added technical_projects table types
2. `src/App.tsx` - Added route for admin technical edit page
3. `src/pages/AdminDashboard.tsx` - Added Technical Projects section
4. `src/components/MinimalProjects.tsx` - Converted to database-driven

## Future Enhancements

Potential improvements for future iterations:
1. Add project categories/tags for filtering
2. Implement ISR (Incremental Static Regeneration) for better performance
3. Add rich text editor for project descriptions
4. Support multiple images per project (gallery)
5. Add project metrics (views, likes)
6. Export/import projects as JSON
7. Add search and filter capabilities in admin
8. Implement bulk operations (delete multiple, bulk edit)
9. Add project status workflow (draft → review → published)
10. Real-time collaboration for multiple admins

## Notes

- The implementation follows the same patterns as the existing Photoshoots admin section
- All components use shadcn/ui components for consistency
- Toast notifications use the `sonner` library
- Animations use `motion/react` (not framer-motion)
- The codebase follows the minimal design system with custom CSS properties
