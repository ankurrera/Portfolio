# Photos Table Schema Documentation

## Overview

This document describes the complete schema for the `photos` table in Supabase, which stores all portfolio photos and their layout information for the WYSIWYG editor.

## Problem Statement

The application was experiencing Supabase errors related to missing or mismatched columns:
- `column photos.z_index does not exist (Code: 42703)`
- `Could not find the 'height' column of 'photos' in the schema cache (Code: PGRST204)`
- `Could not find the 'width' column of 'photos'`

These errors occurred due to conflicting migrations that created columns with different data types.

## Solution

Migration `20251209100000_fix_photos_table_schema.sql` provides a definitive schema by:
1. Dropping conflicting columns if they exist
2. Re-creating all columns with consistent FLOAT/INTEGER types
3. Adding proper indexes for performance
4. Adding documentation comments to columns

## Complete Table Schema

### Core Identification Fields
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the photo |
| `category` | photo_category | NOT NULL | Category enum: 'selected', 'commissioned', 'editorial', 'personal' |

### Content Fields
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `title` | TEXT | NULL | Optional title for the photo |
| `description` | TEXT | NULL | Optional description for the photo |
| `image_url` | TEXT | NOT NULL | Public URL from Supabase storage bucket |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | Order for displaying photos |

### WYSIWYG Layout Fields
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `position_x` | FLOAT | NOT NULL, DEFAULT 0 | X position in pixels for layout |
| `position_y` | FLOAT | NOT NULL, DEFAULT 0 | Y position in pixels for layout |
| `width` | FLOAT | NOT NULL, DEFAULT 300 | Width in pixels |
| `height` | FLOAT | NOT NULL, DEFAULT 400 | Height in pixels |
| `scale` | FLOAT | NOT NULL, DEFAULT 1.0 | Scale factor (1.0 = 100%) |
| `rotation` | FLOAT | NOT NULL, DEFAULT 0 | Rotation angle in degrees |
| `z_index` | INTEGER | NOT NULL, DEFAULT 0 | Z-index for layering (higher = front) |
| `is_draft` | BOOLEAN | NOT NULL, DEFAULT false | Draft (true) vs published (false) state |
| `layout_config` | JSONB | NOT NULL, DEFAULT '{}'::jsonb | Additional layout configuration as JSON |

### Timestamp Fields
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | When the photo was created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | When the photo was last updated |

## Indexes

The following indexes are created for optimal query performance:

1. `idx_photos_z_index` - For ordering photos by layer
2. `idx_photos_is_draft` - For filtering draft vs published photos
3. `idx_photos_category_draft` - Composite index for category + draft filtering

## TypeScript Interface

The corresponding TypeScript interface `PhotoLayoutData` in `src/types/wysiwyg.ts` matches this schema:

```typescript
export interface PhotoLayoutData {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  display_order: number;
  category: PhotoCategory;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  z_index: number;
  is_draft: boolean;
  layout_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

## Common Queries

### Fetch published photos for a category
```typescript
const { data, error } = await supabase
  .from('photos')
  .select('*')
  .eq('category', 'selected')
  .eq('is_draft', false)
  .order('z_index', { ascending: true });
```

### Fetch all photos for editing (including drafts)
```typescript
const { data, error } = await supabase
  .from('photos')
  .select('*')
  .eq('category', 'selected')
  .order('z_index', { ascending: true });
```

### Insert a new photo with layout defaults
```typescript
const { error } = await supabase
  .from('photos')
  .insert({
    category: 'selected',
    image_url: publicUrl,
    display_order: nextOrder,
    title: 'Photo Title',
    position_x: 0,
    position_y: 0,
    width: 300,
    height: 400,
    scale: 1.0,
    rotation: 0,
    z_index: nextZIndex,
    is_draft: true,
  });
```

### Update photo layout
```typescript
const { error } = await supabase
  .from('photos')
  .update({
    position_x: photo.position_x,
    position_y: photo.position_y,
    width: photo.width,
    height: photo.height,
    scale: photo.scale,
    rotation: photo.rotation,
    z_index: photo.z_index,
    is_draft: false, // Publish
  })
  .eq('id', photo.id);
```

## Migration Instructions

### For New Projects

If you're setting up a new Supabase project, run the migrations in order:

1. `20251208080332_remix_migration_from_pg_dump.sql`
2. `20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql` (creates photos table)
3. Skip the old layout migrations
4. `20251209100000_fix_photos_table_schema.sql` (definitive schema)

### For Existing Projects

If you're experiencing schema errors, run only the latest migration:

```bash
supabase db push
```

Or manually execute `20251209100000_fix_photos_table_schema.sql` in the SQL Editor.

**Note**: This migration will drop and recreate the layout columns. Any existing layout data will be lost and reset to defaults. Ensure you have backups if needed.

## Troubleshooting

### Schema Cache Errors

If you see errors like `Could not find the 'width' column of 'photos' in the schema cache`:

1. Ensure the migration has been applied successfully
2. Refresh the schema cache by running:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
3. Restart your Supabase project (Project Settings > General > Restart)
4. Clear your browser cache and reload the application

### Column Type Mismatches

If you see type errors when inserting/updating:

1. Ensure your TypeScript code is sending numbers for numeric fields (not strings)
2. Check that FLOAT fields accept decimal values: `1.5`, `2.0`, `0.5`
3. Check that INTEGER fields accept whole numbers: `1`, `2`, `3`

## RLS Policies

The photos table has the following Row Level Security policies:

- **SELECT**: Anyone can view photos (public access)
- **INSERT**: Only admins can insert photos
- **UPDATE**: Only admins can update photos
- **DELETE**: Only admins can delete photos

Admin access is determined by the `has_role(auth.uid(), 'admin')` function which checks the `user_roles` table.
