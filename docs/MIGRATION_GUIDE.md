# Migration Guide for Photos Table Schema Fix

## Background

The photos table schema had conflicting migrations that created the WYSIWYG layout columns with different data types:
- `20251208110000_add_photo_layout_fields.sql` - Added columns as FLOAT
- `20251209055506_32319858-427e-48e6-b222-69ac957fb071.sql` - Tried to add same columns as INTEGER/NUMERIC with `IF NOT EXISTS`

This caused schema caching errors and column not found errors.

## Solution

Migration `20251209100000_fix_photos_table_schema.sql` provides the definitive schema by:
1. Dropping conflicting columns
2. Recreating them with consistent types
3. Adding proper indexes

## For New Supabase Projects

If you're setting up a fresh Supabase instance, apply migrations in this order:

1. `20251208080332_remix_migration_from_pg_dump.sql` - Extensions
2. `20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql` - Core schema (photos table, user_roles, etc.)
3. `20251208093500_add_auto_user_role_trigger.sql` - Auto-assign user roles
4. `20251208095404_fix_user_roles_rls_policy.sql` - RLS policies
5. **`20251209100000_fix_photos_table_schema.sql`** - ✅ Definitive photos schema
6. `20251209082000_ensure_user_roles_trigger_and_policies.sql` - Final policy fixes

**Skip these conflicting migrations:**
- ❌ `20251208110000_add_photo_layout_fields.sql` (superseded)
- ❌ `20251209055506_32319858-427e-48e6-b222-69ac957fb071.sql` (superseded)

### Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-id

# Apply all migrations
supabase db push
```

The CLI will apply migrations in chronological order based on timestamps.

### Manual Application

If using the SQL Editor in Supabase Dashboard:

1. Go to SQL Editor
2. Run each migration file in the order listed above
3. Click "Run" for each one
4. Verify success before moving to the next

## For Existing Projects with Schema Errors

If you're experiencing errors like:
- `column photos.z_index does not exist`
- `Could not find the 'height' column in schema cache`

You need to apply the fix migration:

### Option 1: Using Supabase CLI

```bash
# This will only apply new migrations (including the fix)
supabase db push
```

### Option 2: Manual SQL Execution

1. Go to Supabase Dashboard → SQL Editor
2. Open a new query
3. Copy and paste the contents of `supabase/migrations/20251209100000_fix_photos_table_schema.sql`
4. Click "Run"
5. Verify the query completes successfully

### Option 3: Direct SQL (if you have access)

```sql
-- This SQL is also in the migration file
ALTER TABLE public.photos
DROP COLUMN IF EXISTS position_x,
DROP COLUMN IF EXISTS position_y,
DROP COLUMN IF EXISTS width,
DROP COLUMN IF EXISTS height,
DROP COLUMN IF EXISTS scale,
DROP COLUMN IF EXISTS rotation,
DROP COLUMN IF EXISTS z_index,
DROP COLUMN IF EXISTS is_draft,
DROP COLUMN IF EXISTS layout_config;

ALTER TABLE public.photos
ADD COLUMN position_x FLOAT NOT NULL DEFAULT 0,
ADD COLUMN position_y FLOAT NOT NULL DEFAULT 0,
ADD COLUMN width FLOAT NOT NULL DEFAULT 300,
ADD COLUMN height FLOAT NOT NULL DEFAULT 400,
ADD COLUMN scale FLOAT NOT NULL DEFAULT 1.0,
ADD COLUMN rotation FLOAT NOT NULL DEFAULT 0,
ADD COLUMN z_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN layout_config JSONB NOT NULL DEFAULT '{}'::jsonb;

DROP INDEX IF EXISTS idx_photos_z_index;
DROP INDEX IF EXISTS idx_photos_is_draft;
CREATE INDEX idx_photos_z_index ON public.photos(z_index);
CREATE INDEX idx_photos_is_draft ON public.photos(is_draft);
CREATE INDEX idx_photos_category_draft ON public.photos(category, is_draft);
```

## After Applying the Migration

### 1. Verify Columns Exist

Run this query in SQL Editor to verify all columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'photos'
ORDER BY ordinal_position;
```

You should see all these columns:
- id (uuid)
- category (USER-DEFINED - photo_category enum)
- title (text)
- description (text)
- image_url (text)
- display_order (integer)
- position_x (double precision / FLOAT)
- position_y (double precision / FLOAT)
- width (double precision / FLOAT)
- height (double precision / FLOAT)
- scale (double precision / FLOAT)
- rotation (double precision / FLOAT)
- z_index (integer)
- is_draft (boolean)
- layout_config (jsonb)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

### 2. Refresh Schema Cache

Force Supabase to refresh its schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

Or restart your Supabase project:
- Go to Project Settings → General
- Click "Restart project"

### 3. Clear Application Cache

In your browser:
- Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear browser cache completely

### 4. Test the Application

1. Log in to the admin dashboard
2. Try uploading a new photo
3. Try dragging/resizing photos in the WYSIWYG editor
4. Save and publish a layout
5. View the published photos on the public gallery

## Important Notes

⚠️ **Data Loss Warning**: This migration drops and recreates the layout columns. Any existing layout data (positions, sizes, etc.) will be reset to defaults. Photos themselves (image_url) are not affected.

If you have important layout data:
1. Back it up before running the migration:
   ```sql
   SELECT id, position_x, position_y, width, height, scale, rotation, z_index
   FROM photos;
   ```
2. Save the results
3. After migration, manually restore the data if needed

## Troubleshooting

### Error: "column already exists"

If you get this error, the columns already exist. Try:
1. Skipping the migration (columns are fine)
2. Or manually drop the columns first, then run the migration

### Error: "permission denied"

You need admin/owner access to run migrations. Check:
1. You're logged in with the project owner account
2. You have the correct database password
3. Your RLS policies aren't blocking the operation

### Schema cache still shows errors

After applying the migration:
1. Run `NOTIFY pgrst, 'reload schema';`
2. Restart the Supabase project
3. Clear browser cache
4. Wait 1-2 minutes for propagation

### Layout fields are all null/default

This is expected after the migration. Photos will have:
- position_x, position_y: 0
- width: 300, height: 400
- scale: 1.0
- rotation: 0
- z_index: 0
- is_draft: false

Re-arrange them in the WYSIWYG editor and save.

## Verification Checklist

After migration, verify:
- [ ] All columns exist in schema
- [ ] Photo upload works without errors
- [ ] WYSIWYG editor loads photos
- [ ] Can drag and resize photos
- [ ] Can save draft layouts
- [ ] Can publish layouts
- [ ] Published photos appear on public gallery
- [ ] No console errors about missing columns

## Need Help?

If you encounter issues:
1. Check the logs in Supabase Dashboard → Logs
2. Check browser console for error messages
3. Review the full error message and code
4. Refer to PHOTOS_TABLE_SCHEMA.md for schema reference
