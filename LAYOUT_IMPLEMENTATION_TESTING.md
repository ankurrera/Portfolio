# Layout Field Implementation - Testing Guide

## Overview
This implementation ensures that photo layout settings from the admin dashboard (position, size, scale, rotation) are properly applied to the public gallery view.

## Changes Made

### 1. TypeScript Interface Updates
- **File**: `src/types/gallery.ts`
- **Changes**: Added WYSIWYG layout fields to `GalleryImage` interface:
  - `position_x?: number`
  - `position_y?: number`
  - `scale?: number`
  - `rotation?: number`
  - `z_index?: number`

### 2. New Component
- **File**: `src/components/LayoutGallery.tsx`
- **Purpose**: Replaces `MasonryGallery` with a layout-aware component
- **Features**:
  - Detects if layout data exists
  - If yes: Applies WYSIWYG positioning with absolute layout
  - If no: Falls back to natural image size with flex layout
  - Responsive scaling using CSS custom properties
  - Preserves z-index ordering
  - Applies scale and rotation transforms
  - Maintains aspect ratios on all device sizes

### 3. Public Page Updates
- **Files**: `src/pages/Index.tsx`, `src/pages/CategoryGallery.tsx`
- **Changes**:
  - Import `LayoutGallery` instead of `MasonryGallery`
  - Pass layout fields from database to `GalleryImage`
  - Order by `z_index` instead of `display_order` for consistency with admin

### 4. Database Schema
- **Already exists**: Migration `20251209100000_fix_photos_table_schema.sql` includes all required fields:
  - `position_x` (FLOAT)
  - `position_y` (FLOAT)
  - `width` (FLOAT)
  - `height` (FLOAT)
  - `scale` (FLOAT)
  - `rotation` (FLOAT)
  - `z_index` (INTEGER)
  - `is_draft` (BOOLEAN)
  - `layout_config` (JSONB)

## Manual Testing Steps

### Prerequisites
1. Ensure you have photos in your Supabase database
2. Have admin access to the dashboard
3. Development server running (`npm run dev`)

### Test Case 1: Layout is Applied
1. **Login to Admin Dashboard**:
   - Navigate to http://localhost:8080/admin/login
   - Login with admin credentials

2. **Position and Size Photos**:
   - Select a category (e.g., SELECTED)
   - Click "Add Photo" to upload some images
   - Drag photos to different positions
   - Resize photos using the resize handle (bottom-right)
   - Scale photos using the scale handle (hold and drag top-right)
   - Use "Bring Forward" / "Send Backward" to adjust z-index

3. **Save Draft**:
   - Click "Save Draft" button in toolbar
   - Verify toast message "Draft saved successfully"

4. **Publish Layout**:
   - Click "Publish" button in toolbar
   - Verify toast message "Layout published successfully!"

5. **View Public Gallery**:
   - Navigate to http://localhost:8080 (or the category URL)
   - **Expected**: Photos should appear at the same positions, sizes, scales, and z-order as in the admin view
   - **Verify**: Layout should scale down proportionally on smaller screens

### Test Case 2: Fallback for Missing Layout Data
1. **Create Photo Without Layout Data** (if possible via SQL):
   ```sql
   INSERT INTO photos (image_url, title, category, is_draft)
   VALUES ('https://example.com/image.jpg', 'Test', 'selected', false);
   ```

2. **View Public Gallery**:
   - Navigate to http://localhost:8080
   - **Expected**: Photo displays at natural size in flex layout
   - **Verify**: No layout errors in console

### Test Case 3: Responsive Behavior
1. **View on Different Screen Sizes**:
   - Use browser DevTools responsive design mode
   - Test mobile (375px), tablet (768px), desktop (1600px) widths
   - **Expected**: Layout scales proportionally, no overflow
   - **Verify**: Images remain in relative positions

### Test Case 4: Z-Index Ordering
1. **In Admin**:
   - Position two photos so they overlap
   - Use "Bring Forward" on the back photo
   - Publish

2. **In Public View**:
   - **Expected**: Same z-order as admin
   - **Verify**: Front photo appears on top

## Success Criteria
- ✅ Photos in public gallery match admin layout (position, size, scale, rotation)
- ✅ Layout is responsive and doesn't overflow on mobile
- ✅ Fallback works when layout fields are missing
- ✅ Z-index ordering is preserved
- ✅ Build succeeds without errors
- ✅ No new linting errors in changed files

## Rollback Plan
If issues arise, revert to `MasonryGallery`:
1. In `src/pages/Index.tsx` and `src/pages/CategoryGallery.tsx`:
   - Change import from `LayoutGallery` to `MasonryGallery`
   - Replace `<LayoutGallery` with `<MasonryGallery`
2. Remove layout fields from data transformation (optional)
3. Delete `src/components/LayoutGallery.tsx` (optional)
