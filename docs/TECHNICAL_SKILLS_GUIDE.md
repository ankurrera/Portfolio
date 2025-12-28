# Technical Skills Management Module

## Overview

The Technical Skills Management Module provides a fully dynamic, admin-managed system for displaying skill categories and items in the Technical Portfolio section. Skills can be added, edited, reordered, and toggled for visibility without any code changes.

## Features

### Admin Dashboard
- ✅ Create new skill categories (e.g., Frontend, Backend, Tools, Specialties)
- ✅ Edit existing categories and their skills
- ✅ Reorder categories with up/down buttons
- ✅ Toggle visibility for individual categories
- ✅ Delete categories
- ✅ Add/remove/edit individual skill items within each category
- ✅ Inline skill management

### Public Display
- ✅ Dynamically fetches skills from Supabase
- ✅ Only displays visible categories
- ✅ Maintains original UI design (cards, typography, spacing)
- ✅ Fully responsive across all devices
- ✅ Empty state handling (no categories = no section)

## Database Schema

### Table: `technical_skills`

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | Auto-generated |
| `category` | TEXT | Category name (e.g., "Frontend") | Required |
| `skills` | TEXT[] | Array of skill names | `[]` |
| `order_index` | INTEGER | Display order (lower = first) | `0` |
| `is_visible` | BOOLEAN | Whether to show on public page | `true` |
| `created_at` | TIMESTAMP | Creation timestamp | `now()` |

### RLS Policies

**Public Users:**
- Can SELECT skills where `is_visible = true`

**Authenticated Admin Users:**
- Full INSERT, UPDATE, DELETE access

## How to Use

### Access Skills Manager

1. Log in to the Admin Dashboard at `/admin/login`
2. Click on **"Skills Manager"** under the **Technical Projects** section
3. Or navigate directly to `/admin/technical/skills/edit`

### Create a New Skill Category

1. Click the **"New Category"** button
2. Enter a category name (e.g., "Frontend", "Backend", "Tools")
3. Add individual skills by:
   - Typing a skill name in the input field
   - Pressing Enter or clicking the **+** button
4. Toggle the **"Visible on Public Page"** switch if needed
5. Click **"Save Category"**

### Edit an Existing Category

1. Find the category in the list
2. Click the **Edit** button (pencil icon)
3. Modify the category name or skills:
   - To edit a skill: Click in its input field and change the text
   - To add a skill: Use the input field at the bottom
   - To remove a skill: Click the **X** button next to it
4. Click **"Save Category"**

### Reorder Categories

Use the **▲** and **▼** buttons next to each category to move it up or down in the display order.

### Toggle Visibility

Use the switch next to each category to show/hide it on the public Technical Portfolio page without deleting it.

### Delete a Category

1. Click the **Trash** button next to the category
2. Confirm the deletion in the dialog

**Note:** This action cannot be undone.

## Implementation Details

### Components

**`AdminSkillsEdit.tsx`** (`/src/pages/`)
- Main admin page for managing skills
- Handles authentication and routing
- Manages state and database operations

**`SkillCategoryForm.tsx`** (`/src/components/admin/`)
- Form component for creating/editing categories
- Inline skill management
- Input validation

**`SkillCategoryList.tsx`** (`/src/components/admin/`)
- Lists all skill categories
- Reorder, edit, delete, visibility toggle controls
- Empty state display

### Hooks

**`useTechnicalSkills.ts`** (`/src/hooks/`)
- Fetches visible skills from Supabase
- Returns `{ skills, loading, error }`
- Used by the public-facing component

### Updated Components

**`MinimalAbout.tsx`** (`/src/components/`)
- Now fetches skills dynamically using `useTechnicalSkills`
- Maintains original UI/UX
- Conditional rendering based on data availability

### Routes

- `/admin/technical/skills/edit` - Skills Manager (Admin only)

### Database Migration

Located at: `supabase/migrations/20251227165000_create_technical_skills_table.sql`

This migration:
- Creates the `technical_skills` table
- Sets up RLS policies
- Creates performance indexes
- Seeds initial data from hardcoded values

## Testing Checklist

### Admin Functionality
- [ ] Can create a new skill category
- [ ] Can edit an existing category name
- [ ] Can add skills to a category
- [ ] Can edit individual skill names
- [ ] Can remove individual skills
- [ ] Can reorder categories with up/down buttons
- [ ] Can toggle visibility on/off
- [ ] Can delete a category
- [ ] Empty state displays correctly when no categories exist
- [ ] Form validation prevents empty categories/skills

### Public Display
- [ ] Skills display on Technical Portfolio page (`/technical`)
- [ ] Only visible categories are shown
- [ ] Categories appear in correct order
- [ ] UI matches original design (no visual changes)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Empty categories don't render
- [ ] Section doesn't show if no visible skills exist

### Security
- [ ] Non-admin users cannot access `/admin/technical/skills/edit`
- [ ] Public users can only see visible skills
- [ ] RLS policies prevent unauthorized modifications

## Troubleshooting

### Skills not appearing on public page

1. Check if categories are set to `is_visible = true` in admin
2. Verify database connection in browser console
3. Check that skills array is not empty
4. Ensure `order_index` is set correctly

### Admin page not accessible

1. Verify you're logged in as an admin user
2. Check that your user has the `admin` role in `user_roles` table
3. Clear browser cache and try again

### Skills not saving

1. Check browser console for errors
2. Verify Supabase connection
3. Confirm RLS policies are correctly set
4. Check that authentication token is valid

## Database Maintenance

### View all skills (SQL)
```sql
SELECT * FROM technical_skills ORDER BY order_index;
```

### Update skill visibility (SQL)
```sql
UPDATE technical_skills 
SET is_visible = false 
WHERE category = 'CategoryName';
```

### Reorder categories (SQL)
```sql
UPDATE technical_skills 
SET order_index = NEW_ORDER 
WHERE id = 'CATEGORY_ID';
```

### Reset to defaults (SQL)
```sql
TRUNCATE technical_skills;

INSERT INTO technical_skills (category, skills, order_index, is_visible) VALUES
  ('Frontend', ARRAY['React', 'TypeScript', 'Next.js', 'Vue.js'], 1, true),
  ('Backend', ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB'], 2, true),
  ('Tools', ARRAY['AWS', 'Docker', 'Git', 'Figma'], 3, true),
  ('Specialties', ARRAY['AI/ML', 'Web3', 'Performance', 'Security'], 4, true);
```

## Best Practices

1. **Keep categories focused**: Limit to 4-6 categories for best UX
2. **Use clear names**: Category names should be immediately understandable
3. **Limit skills per category**: 3-6 skills per category works best visually
4. **Use visibility toggle**: Hide categories temporarily instead of deleting
5. **Test on multiple devices**: Always check responsive behavior after changes

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Verify database connection and RLS policies
4. Check Supabase logs for server-side errors
