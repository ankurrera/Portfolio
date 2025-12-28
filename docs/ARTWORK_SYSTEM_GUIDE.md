# Artwork Upload & Edit System - Implementation Guide

## Overview

This document describes the new artwork management system for the Artistic section of the portfolio. The system has been migrated from using the generic `photos` table to a dedicated `artworks` table with specialized metadata fields.

## What Changed

### Database Schema
- **New Table**: `artworks` - Dedicated table for artistic works with specialized metadata
- **Migration Script**: Automated migration from `photos` (category='artistic') to `artworks`
- **RLS Policies**: Row-level security for admin/editor access and public viewing

### Admin Interface
- **Location**: `/admin/artistic/edit` (same as before)
- **New Components**:
  - `ArtworkWYSIWYGEditor` - Specialized WYSIWYG editor for artworks
  - `ArtworkUploader` - Upload form with artwork-specific metadata fields
  - `ArtworkEditPanel` - Side panel for editing artwork metadata
  - `DraggableArtwork` - Draggable artwork component for canvas layout

### Public Display
- **Location**: `/artistic` (same as before)
- **Data Source**: Now reads from `artworks` table instead of `photos`
- **Metadata Display**: Enhanced with artwork-specific information

## Artwork Metadata Fields

The new system includes the following metadata fields:

### Required Fields
- **Artwork Title** - Title of the artwork (max 200 characters)
- **Primary Artwork Image** - Main image of the artwork

### Optional Fields
- **Creation Date** - Date when the artwork was created
- **Dimensions** - Dropdown with presets (A4, A3) or custom dimensions with unit (cm, in, mm)
- **Description / Concept** - Textarea for artwork description (recommended 2-3 lines, max 1000 chars)
- **Materials Used**:
  - Pencil Grades - Multiselect (9H to 9B)
  - Charcoal Types - Multiselect (Compressed, Vine, White, Willow, Pencil)
  - Paper Type - Text input (e.g., "Canson Bristol", "Strathmore 400")
- **Time Taken to Complete** - Free text (e.g., "3 hours", "2 days")
- **Category / Collection Tags** - Multiselect with defaults + custom tags
  - Default tags: Portrait sketch, Landscape sketch, Character design, Concept sketch, Fan art
- **Copyright** - Copyright notice (default: "© Ankur Bag.")
- **Additional Images / Process Shots** - Multiple image uploads showing work in progress
- **Visibility / Published Toggle** - Control whether artwork is visible to public
- **External / Purchase Link** - Optional URL for external gallery or purchase page

## Migration Process

### Prerequisites
1. Ensure you have Supabase CLI installed and configured
2. Environment variables set in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 1: Apply Database Migrations

```bash
# Push migrations to Supabase
supabase db push

# Or using npm script if configured
npm run db:push
```

This will create:
- `artworks` table with all metadata fields
- RLS policies for security
- Migration function `migrate_artistic_photos_to_artworks()`
- Verification view `artistic_migration_verification`

### Step 2: Run Migration Script

```bash
# Run the migration script
node migrate-artworks.mjs
```

The script will:
1. Check if the artworks table exists
2. Count artistic photos in the photos table
3. Execute the migration function
4. Verify the migration results
5. Display a summary report

### Step 3: Verify Migration

1. **Admin Panel**: Go to `/admin/artistic/edit`
   - Check that migrated artworks appear
   - Test drag-and-drop functionality
   - Test editing metadata
   - Test deleting an artwork

2. **Public Page**: Go to `/artistic`
   - Verify artworks display correctly
   - Check that only published artworks are visible
   - Test lightbox functionality

3. **Database**: Check the data directly
   ```sql
   -- View migration verification
   SELECT * FROM artistic_migration_verification;
   
   -- View artworks
   SELECT id, title, is_published, created_at FROM artworks;
   ```

### Step 4: Post-Migration Cleanup (Optional)

After verifying the migration was successful, you may optionally delete the artistic photos from the photos table:

```sql
-- CAUTION: Only run this after thorough verification
-- This is irreversible without a backup

-- View what will be deleted first
SELECT id, title, created_at FROM photos WHERE category = 'artistic';

-- If you're sure, delete them
DELETE FROM photos WHERE category = 'artistic';
```

**⚠️ Important**: Keep a database backup before deleting anything!

## Admin Features

### Upload New Artwork

1. Go to `/admin/artistic/edit`
2. Click "Upload" button
3. Fill in the artwork metadata form:
   - Add artwork title (required)
   - Select or upload primary image (required)
   - Add creation date
   - Select dimension preset or enter custom dimensions
   - Add description/concept
   - Select materials used (pencils, charcoal, paper)
   - Add time taken
   - Select or add custom tags
   - Optionally add process images
   - Toggle "Published" to make visible
   - Add external/purchase link if applicable
4. Click "Upload Artwork"

### Edit Existing Artwork

1. On the canvas, hover over an artwork
2. Click the "Edit" (pencil) icon in the toolbar
3. Side panel opens with all metadata fields
4. Make changes and click "Save Changes"

### Layout Management

- **Drag**: Click and drag artworks to reposition
- **Resize**: Drag the bottom-right corner handle
- **Layer Order**: Use "Bring Forward" / "Send Backward" buttons
- **Delete**: Click the trash icon
- **Preview**: Switch between Edit/Preview modes
- **Device Preview**: Test layout on Desktop/Tablet/Mobile views
- **Grid Snap**: Toggle grid snapping for precise alignment
- **Autosave**: Changes are automatically saved after 2 seconds

## Public Display Features

The public Artistic page (`/artistic`) displays:
- All published artworks (unpublished are hidden)
- WYSIWYG layout as configured in admin
- Lightbox view with:
  - High-resolution original images
  - Artwork title
  - Creation date
  - Materials used
  - Copyright information
  - Navigation between artworks

## File Storage

Images are stored in Supabase Storage under the `photos` bucket:

```
photos/
├── artworks/
│   ├── originals/          # Original uploaded files (byte-for-byte)
│   │   └── process/        # Process shot originals
│   └── derivatives/        # Web-optimized WebP files (95% quality, max 2400px)
│       └── process/        # Process shot derivatives
```

## RLS Policies

### Public Access
- Can **SELECT** (view) published artworks only (`is_published = true`)

### Admin/Editor Access (authenticated users with admin or editor role)
- Can **SELECT** all artworks (including unpublished)
- Can **INSERT** new artworks
- Can **UPDATE** existing artworks
- Can **DELETE** artworks

## API Reference

### Fetch Published Artworks (Public)

```javascript
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .eq('is_published', true)
  .order('z_index', { ascending: true });
```

### Fetch All Artworks (Admin)

```javascript
const { data, error } = await supabase
  .from('artworks')
  .select('*')
  .order('z_index', { ascending: true });
```

### Insert New Artwork

```javascript
const { data, error } = await supabase
  .from('artworks')
  .insert({
    title: 'My Artwork',
    primary_image_url: 'https://...',
    is_published: true,
    // ... other fields
  });
```

### Update Artwork

```javascript
const { data, error } = await supabase
  .from('artworks')
  .update({
    title: 'Updated Title',
    is_published: false,
  })
  .eq('id', artworkId);
```

### Delete Artwork

```javascript
const { data, error } = await supabase
  .from('artworks')
  .delete()
  .eq('id', artworkId);
```

## Troubleshooting

### Migration Issues

**Problem**: Migration script fails with "artworks table does not exist"
- **Solution**: Run `supabase db push` to apply migrations first

**Problem**: Migration shows "0 migrated"
- **Solution**: Check if artistic photos exist in photos table:
  ```sql
  SELECT COUNT(*) FROM photos WHERE category = 'artistic';
  ```

**Problem**: Some artworks missing after migration
- **Solution**: Check the verification view:
  ```sql
  SELECT * FROM artistic_migration_verification;
  ```

### Upload Issues

**Problem**: Upload fails with "Primary artwork image is required"
- **Solution**: Ensure you've selected an image file before clicking Upload

**Problem**: Custom dimensions not saving
- **Solution**: Select "Custom" from dimension preset dropdown first

**Problem**: Tags not saving
- **Solution**: Press Enter or click "Add" after typing a custom tag

### Display Issues

**Problem**: Artworks not showing on public page
- **Solution**: Check that artworks are published:
  ```sql
  SELECT id, title, is_published FROM artworks;
  ```

**Problem**: Layout looks different than admin preview
- **Solution**: Clear browser cache and reload the page

## Support

For issues or questions:
1. Check the console for error messages (F12 in browser)
2. Review Supabase logs in the dashboard
3. Verify RLS policies are correctly applied
4. Check that user has admin/editor role in `user_roles` table

## Future Enhancements

Potential future improvements:
- Bulk upload functionality
- Advanced search and filtering
- Export artwork catalog as PDF
- Integration with print-on-demand services
- Public commenting system
- Artwork series/collections grouping
