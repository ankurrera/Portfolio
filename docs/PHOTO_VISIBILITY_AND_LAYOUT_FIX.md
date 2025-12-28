# Photo Visibility and Admin Layout Fix

## Problem Statement

This document describes the critical bugs that were affecting photo visibility and admin dashboard layout, and the solutions implemented.

## Issues Fixed

### 1. Critical Bug: Photos Disappearing from Public View

#### Problem
Photos uploaded via the admin dashboard would disappear from the public view after the admin clicked the "Save Draft" button.

#### Root Cause
The "Save Draft" button (`handleSave` function) was setting `is_draft: true` on ALL photos in the category. Since public pages filter for `is_draft: false`, this caused all photos to become invisible to public users.

#### Flow of the Bug
1. Admin uploads photos → `is_draft: false` (visible to public) ✅
2. Admin arranges photos in WYSIWYG editor → still visible ✅
3. Admin clicks "Save Draft" → `is_draft: true` (hidden from public) ❌
4. Public users see no photos ❌

#### Solution
Changed the save behavior so that:
- **Save Layout** button: Updates only position/layout fields WITHOUT changing `is_draft` status
- **Publish** button: Updates position/layout AND explicitly sets `is_draft: false` to ensure photos are public

#### Changed Files
- `src/components/admin/WYSIWYGEditor.tsx` - Modified `handleSave` and `handlePublish` functions
- `src/components/admin/EditorToolbar.tsx` - Renamed button and added tooltip

### 2. Admin Dashboard Layout Issues

#### Problems
- Grid lines not appearing beneath all images
- Photos not properly center-aligned
- Unnecessary horizontal scrolling
- Inconsistent spacing during drag-and-drop

#### Solutions
1. **Grid Lines**: Fixed grid overlay to span full canvas height with explicit width/height styles
2. **Center Alignment**: Set `transformOrigin: 'center center'` on all draggable photos
3. **Horizontal Scrolling**: Added `overflow-x-hidden` to prevent unwanted horizontal scroll
4. **Spacing**: Updated canvas container to use explicit height calculation based on photo positions

#### Changed Files
- `src/components/admin/WYSIWYGEditor.tsx` - Fixed canvas container and grid overlay
- `src/components/admin/DraggablePhoto.tsx` - Added proper transform-origin
- `src/components/LayoutGallery.tsx` - Ensured consistency with admin view

## How It Works Now

### Photo Upload Flow
```
1. Admin uploads photo
   ↓
2. Photo saved with is_draft: false (immediately visible to public)
   ↓
3. Photo appears in both admin dashboard and public view
```

### Layout Editing Flow
```
1. Admin arranges photos in WYSIWYG editor
   ↓
2. Admin clicks "Save Layout"
   ↓
3. Positions/sizes saved, is_draft status UNCHANGED
   ↓
4. Photos remain visible to public
```

### Publishing Flow
```
1. Admin arranges photos
   ↓
2. Admin clicks "Publish"
   ↓
3. Positions/sizes saved AND is_draft: false set explicitly
   ↓
4. All photos guaranteed to be visible to public
```

## Testing Instructions

### Test Photo Visibility Fix
1. Log in to admin dashboard (`/admin`)
2. Upload a new photo using "Add Photo" button
3. Verify photo appears in admin view
4. Open public homepage in incognito/new tab - verify photo is visible
5. Go back to admin, arrange the photo (drag/resize)
6. Click "Save Layout" button
7. **CRITICAL TEST**: Refresh public homepage - photo should STILL be visible ✅
8. Click "Publish" button
9. Refresh public homepage - photo should still be visible ✅

### Test Admin Layout Fixes
1. Log in to admin dashboard
2. Upload multiple photos (at least 3-4)
3. Enable grid (Grid button in toolbar)
4. Verify grid lines appear beneath all photos
5. Drag photos around - verify they stay center-aligned
6. Check that there's no horizontal scrollbar at bottom of page
7. Resize browser window - verify grid scales properly
8. Drag photos to different positions - verify spacing is consistent

## Technical Details

### is_draft Flag Behavior

The `is_draft` flag on the `photos` table now works as follows:

- **false** (default): Photo is published and visible to public users
- **true**: Photo is hidden from public users (draft state)

The flag is now managed carefully:

- **On Upload**: Always set to `false` (immediately published)
- **On Save Layout**: Flag is NOT modified (photos keep their current state)
- **On Publish**: Explicitly set to `false` (ensures all photos are visible)

### Database Schema
```sql
-- photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  category photo_category NOT NULL,
  image_url TEXT NOT NULL,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 300,
  height FLOAT DEFAULT 400,
  scale FLOAT DEFAULT 1.0,
  rotation FLOAT DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  is_draft BOOLEAN DEFAULT false,  -- Controls photo visibility
  ...
);
```

### Component Architecture

**Public View (Index.tsx, CategoryGallery.tsx)**
```typescript
// Fetches only published photos
const { data } = await supabase
  .from('photos')
  .select('*')
  .eq('category', category)
  .eq('is_draft', false)  // Only show published photos
  .order('z_index');
```

**Admin View (WYSIWYGEditor.tsx)**
```typescript
// Fetches all photos (published and draft)
const { data } = await supabase
  .from('photos')
  .select('*')
  .eq('category', category)
  .order('z_index');  // No is_draft filter
```

## Migration Notes

No database migration required. This fix only changes application logic, not the database schema.

However, if you previously clicked "Save Draft" and your photos disappeared:

1. Go to admin dashboard
2. Select the affected category
3. Click "Publish" button
4. All photos in that category will become visible again

## Code Quality

- ✅ Build passes without errors
- ✅ No TypeScript compilation errors
- ✅ CodeQL security scan: 0 vulnerabilities
- ✅ Code review feedback addressed
- ✅ Performance optimized (canvas height calculated once)
- ✅ Comprehensive comments added for critical behavior

## Future Improvements

Consider these enhancements for future iterations:

1. Add a "Draft/Published" toggle per photo in the admin UI
2. Add visual indicator in admin to show which photos are draft vs published
3. Add bulk publish/unpublish actions
4. Add preview mode that shows "Public View" vs "All Photos" toggle
5. Add undo/redo for publish/draft state changes

## Related Files

### Modified Files
- `src/components/admin/WYSIWYGEditor.tsx`
- `src/components/admin/EditorToolbar.tsx`
- `src/components/admin/DraggablePhoto.tsx`
- `src/components/LayoutGallery.tsx`

### Related Documentation
- `WYSIWYG_EDITOR_GUIDE.md` - General editor usage
- `supabase/migrations/20251209100000_fix_photos_table_schema.sql` - Photos table schema
- `src/types/wysiwyg.ts` - Type definitions

## Contact

If you encounter any issues with photo visibility or layout, please:
1. Check this document first
2. Verify the testing instructions
3. Review the database state using Supabase dashboard
4. File an issue with reproduction steps
