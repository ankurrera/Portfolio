# Draft Persistence & Form Unification - Testing Guide

## Overview
This document provides comprehensive testing instructions for the Draft Persistence and Form Unification implementation.

## What Was Implemented

### Part 1: Form Draft Persistence

#### New Hook: `useFormDraft`
- **Location**: `src/hooks/useFormDraft.ts`
- **Purpose**: Persists form input data (NOT canvas/UI state) to localStorage
- **Features**:
  - Debounced auto-save (500ms)
  - Validates draft has meaningful data before restoring
  - Excludes canvas/UI fields (position_x, position_y, width, height, scale, rotation, z_index)
  - Only shows "Draft restored" message when real form data exists

#### Updated Components

1. **ArtworkUploader** (`src/components/admin/ArtworkUploader.tsx`)
   - Now uses `UnifiedArtworkForm` component
   - Integrates `useFormDraft` hook with key: `artwork_add_form_draft`
   - Displays `DraftIndicator` component
   - Clears draft on successful upload
   - Clears draft on discard action
   - Persists: title, description, creation_date, dimensions, materials, tags, copyright, external_link, isPublished

2. **PhotoUploader** (`src/components/admin/PhotoUploader.tsx`)
   - Integrates `useFormDraft` hook with key: `photoshoot_add_form_draft`
   - Displays `DraftIndicator` component
   - Clears draft on successful upload
   - Clears draft on discard action
   - Persists: caption, photographer_name, date_taken, device_used, year, tags, credits, camera_lens, project_visibility, external_links

### Part 2: Form Unification (Artwork)

#### New Component: `UnifiedArtworkForm`
- **Location**: `src/components/admin/UnifiedArtworkForm.tsx`
- **Purpose**: Single form component used for both Upload and Edit modes
- **Features**:
  - Supports `mode: "add" | "edit"`
  - Canonical field order maintained for both modes
  - Images optional in edit mode
  - Same validation rules for both modes

#### Updated Components

1. **ArtworkEditPanel** (`src/components/admin/ArtworkEditPanel.tsx`)
   - Uses same field order as upload form (via `ArtworkMetadataForm`)
   - NO draft persistence in edit mode
   - Loads data from database only
   - Images are read-only in edit mode

## Testing Instructions

### Test 1: Artwork Upload Form Draft Persistence

#### Setup
1. Navigate to `/admin/artistic/edit` (login if needed)
2. Click "Upload New Artwork" button

#### Test Steps
1. **Initial State**
   - Form should be empty
   - No "Draft restored" message should appear
   - No draft indicator visible

2. **Fill Form and Verify Auto-Save**
   - Enter artwork title: "Test Artwork Draft"
   - Enter description: "This is a test description"
   - Select creation date
   - Choose dimension preset or enter custom dimensions
   - Select some pencil grades and/or charcoal types
   - Enter paper type
   - Add tags
   - Verify "Saving draft..." indicator appears briefly
   - Verify "Draft saved" indicator appears

3. **Test Draft Restoration**
   - Refresh the page (Ctrl+R or Cmd+R)
   - Click "Upload New Artwork" again
   - Verify "Draft restored from previous session" message appears
   - Verify all form fields are populated with previously entered data
   - Verify "Discard" button is visible in draft indicator

4. **Test Draft Discard**
   - Click "Discard" button in draft indicator
   - Verify form is cleared
   - Verify "Draft discarded" toast message appears
   - Refresh page and verify no draft is restored

5. **Test Draft Clear on Upload**
   - Fill form again with test data
   - Select a primary artwork image
   - Click "Upload Artwork"
   - Wait for successful upload
   - Refresh page
   - Click "Upload New Artwork"
   - Verify NO draft is restored (form should be empty)

6. **Test Empty Draft Not Restored**
   - Click "Upload New Artwork"
   - Type one character in title, then delete it
   - Wait for auto-save
   - Refresh page
   - Click "Upload New Artwork"
   - Verify NO "Draft restored" message (empty drafts are ignored)

### Test 2: Photoshoot Upload Form Draft Persistence

#### Setup
1. Navigate to `/admin/photoshoots/edit`
2. Click "Add Photos" or similar upload button

#### Test Steps
1. **Fill Form and Verify Auto-Save**
   - Enter caption: "Test Photo Caption"
   - Enter photographer name
   - Select date taken
   - Enter device used
   - Add tags
   - Enter credits
   - Verify auto-save indicators work

2. **Test Draft Restoration**
   - Refresh page
   - Reopen upload dialog
   - Verify "Draft restored from previous session" appears
   - Verify all fields populated correctly

3. **Test Draft Clear on Upload**
   - Select image/video files
   - Click "Upload & Publish"
   - Wait for completion
   - Reopen upload dialog
   - Verify NO draft restored

### Test 3: Artwork Form Unification

#### Test Upload Form Fields (mode="add")
1. Navigate to "Upload New Artwork"
2. Verify field order matches this canonical list:
   1. Artwork Title *
   2. Creation Date
   3. Dimensions (preset + custom)
   4. Description / Concept
   5. Pencil Grades
   6. Charcoal Types
   7. Paper Type
   8. Time Taken to Complete
   9. Category / Collection Tags
   10. Copyright
   11. External / Purchase Link
   12. Primary Artwork Image *
   13. Additional Images / Process Shots
   14. Published Toggle

#### Test Edit Form Fields (mode="edit")
1. Upload a test artwork first
2. Close upload dialog
3. Click edit button on the artwork
4. Verify field order MATCHES upload form exactly
5. Verify all fields are pre-filled with artwork data
6. Verify primary image shows current image with message "Current image (cannot be changed in edit mode)"
7. Verify process images are read-only
8. Verify NO draft indicator appears
9. Make changes and save
10. Verify changes persist

### Test 4: Edit Mode - No Draft Persistence

#### Test Steps
1. Open any artwork for editing
2. Make changes to form fields
3. Refresh page (WITHOUT saving)
4. Open same artwork for editing again
5. Verify changes were NOT saved (no draft)
6. Verify form shows original database values

### Test 5: Canvas/Layout Persistence (Verify Not Broken)

#### Test Steps
1. In WYSIWYG editor, move an artwork on the canvas
2. Resize an artwork
3. Rotate an artwork
4. Change z-index by bringing forward/backward
5. Refresh page
6. Verify layout changes are preserved
7. Verify "Draft restored from previous session" appears (this is for canvas layout, not form data)
8. Click "Discard" in draft indicator
9. Verify artworks return to saved database positions

## Expected Behaviors Summary

### Form Draft Persistence (useFormDraft)
✅ Auto-saves form inputs every 500ms
✅ Shows "Draft restored" only when meaningful data exists
✅ Clears draft on successful upload
✅ Clears draft on discard action
✅ Does NOT persist canvas/UI state
✅ Does NOT persist File objects (images/videos)

### Canvas Layout Persistence (useFormPersistence)
✅ Auto-saves canvas positions, sizes, rotations
✅ Only used in WYSIWYG editors
✅ Separate from form draft persistence
✅ Has its own "Draft restored" indicator

### Form Unification (Artwork)
✅ Upload and Edit use same field order
✅ Edit mode pre-fills all fields from database
✅ Edit mode has NO draft persistence
✅ Edit mode images are optional/read-only
✅ Upload mode requires primary image

## Troubleshooting

### "Draft restored" message appears but form is empty
- This should NOT happen with the new implementation
- If it does, check browser localStorage for the draft keys
- Keys: `artwork_add_form_draft`, `photoshoot_add_form_draft`
- Delete the keys manually if corrupted

### Draft not saving
- Check browser console for errors
- Verify localStorage is not full
- Check that debounce delay has passed (wait >500ms after typing)

### Draft not clearing after upload
- Check that `clearDraft()` is being called in upload success handler
- Check browser console for errors during upload

### Edit form showing draft indicator
- This is a BUG - edit mode should never use form drafts
- Verify `ArtworkEditPanel` is NOT using `useFormDraft`

## Browser Storage Keys

These keys are used in localStorage:

### Form Drafts (New Implementation)
- `artwork_add_form_draft` - Artwork upload form data
- `photoshoot_add_form_draft` - Photoshoot upload form data

### Canvas Layout (Existing)
- `admin:draft:artistic` - Artwork canvas layout
- `admin:draft:photoshoots` - Photoshoot canvas layout

## Success Criteria

All tests above should pass with the following outcomes:

✅ Form inputs auto-save and restore correctly
✅ Canvas layouts auto-save separately (not confused with form drafts)
✅ "Draft restored" only appears when real form data exists
✅ Drafts clear immediately after successful upload
✅ Drafts clear when user clicks discard
✅ Edit mode loads from database only (no drafts)
✅ Artwork Upload and Edit forms have identical field order
✅ Image handling follows the rules (required in add, optional in edit)
✅ No TypeScript errors in build
✅ No console errors during testing
