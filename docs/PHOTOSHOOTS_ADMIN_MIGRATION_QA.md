# Photoshoots Admin Dashboard Migration - QA Checklist

## Overview
This document provides a comprehensive QA checklist for the Photoshoots admin dashboard migration. The migration moves photo editing tools from the global admin canvas to dedicated edit pages under the Photoshoots section.

## Changes Summary

### New Files Created
1. **src/pages/AdminDashboard.tsx** - Main admin landing page with Photoshoots section
2. **src/pages/AdminPhotoshootsEdit.tsx** - Dedicated edit page for each photoshoot category

### Modified Files
1. **src/pages/Admin.tsx** - Now redirects to AdminDashboard
2. **src/App.tsx** - Added new routes for admin dashboard and photoshoot editing

### New Routes
- `/admin` → Redirects to `/admin/dashboard` (after authentication)
- `/admin/dashboard` → Admin landing page with Photoshoots section
- `/admin/photoshoots/:category/edit` → Edit page for specific category (selected, commissioned, editorial, personal)

## QA Testing Checklist

### Phase 1: Authentication & Navigation
- [ ] Accessing `/admin` without authentication redirects to `/admin/login`
- [ ] Successful login redirects to `/admin/dashboard`
- [ ] Non-admin users are kicked out and redirected to login
- [ ] Sign out button works from dashboard
- [ ] Admin dashboard displays correctly with Photoshoots section
- [ ] All four category cards are visible (Selected, Commissioned, Editorial, Personal)

### Phase 2: Navigation Flow
- [ ] Clicking on a category card navigates to `/admin/photoshoots/{category}/edit`
- [ ] "Back to Dashboard" breadcrumb link works
- [ ] Category switcher in toolbar navigates to correct edit pages
- [ ] URL updates correctly when switching categories
- [ ] Direct URL access to edit page works (e.g., `/admin/photoshoots/selected/edit`)
- [ ] Invalid category in URL redirects to dashboard

### Phase 3: WYSIWYGEditor Functionality (ALL MUST WORK AS BEFORE)

#### Photo Upload
- [ ] "Add Photo" button opens upload dialog
- [ ] Drag-and-drop file upload works
- [ ] Multiple file upload works
- [ ] Upload progress indicators work
- [ ] Photos appear in gallery after upload
- [ ] Upload to correct category
- [ ] File validation works (image types only)

#### Photo Editing & Metadata
- [ ] Caption field edits and saves correctly
- [ ] Photographer Name field edits and saves
- [ ] Date Taken field edits and saves
- [ ] Device Used field edits and saves
- [ ] Video thumbnail upload works (optional field)
- [ ] Metadata persists after save/refresh

#### Drag-and-Drop & Layout
- [ ] Photos can be dragged and repositioned
- [ ] Placeholder shows correct size during drag
- [ ] Other photos animate/reflow during drag
- [ ] Drop completes and photo stays in new position
- [ ] Drag works in all device preview modes (Desktop/Tablet/Mobile)
- [ ] Z-index controls work (Bring Forward/Send Backward)
- [ ] Rotation and scale controls work

#### Grid & Layout Controls
- [ ] Snap-to-grid toggle works
- [ ] Grid guides display when enabled
- [ ] Grid size is correct (20px as before)
- [ ] Guides scale with device preview

#### Device Preview
- [ ] Desktop preview shows full width (up to 1600px)
- [ ] Tablet preview shows 900px width with dashed border
- [ ] Mobile preview shows 420px width with dashed border
- [ ] Device label displays correctly in tablet/mobile modes
- [ ] Layout recalculates when switching devices
- [ ] Zoom scaling is correct (Mobile: 0.2625, Tablet: 0.5625, Desktop: 1.0)

#### Save & Publish
- [ ] "Save Layout" saves positions without changing draft status
- [ ] "Publish" saves and sets is_draft=false for all photos
- [ ] Success toasts appear after save/publish
- [ ] Unsaved changes indicator works
- [ ] Changes persist after page refresh

#### History & Undo/Redo
- [ ] Undo button works
- [ ] Redo button works
- [ ] History dialog shows edit history
- [ ] Restoring from history works
- [ ] History persists within session

#### Preview Mode
- [ ] Switch to Preview mode disables editing
- [ ] Switch back to Edit mode re-enables editing
- [ ] Photos are not draggable in preview mode

#### Photo Management
- [ ] Delete photo works
- [ ] Delete removes from storage and database
- [ ] Confirmation dialog appears before delete
- [ ] Photo list refreshes after delete
- [ ] Refresh button reloads photos from database

### Phase 4: Data Integrity & API

#### Database Operations
- [ ] All CRUD operations use same API endpoints as before
- [ ] Photo IDs remain unchanged
- [ ] Asset URLs remain unchanged
- [ ] Category filtering works correctly
- [ ] Z-index ordering persists correctly

#### Storage
- [ ] Photos upload to same storage bucket
- [ ] Storage paths remain unchanged
- [ ] Deletion removes from storage correctly
- [ ] No orphaned files in storage

### Phase 5: Public View Consistency
- [ ] Published photos appear on public pages
- [ ] Layout matches what was saved in admin
- [ ] Metadata displays correctly in public galleries
- [ ] Lightbox shows all metadata fields
- [ ] Responsive layouts work (Desktop/Tablet/Mobile)
- [ ] No breaking changes to public view

### Phase 6: Performance & UX
- [ ] Page loads quickly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful

### Phase 7: Backward Compatibility
- [ ] Existing photo data displays correctly
- [ ] Old URLs redirect properly
- [ ] Database schema unchanged
- [ ] No data migration required
- [ ] Rollback path is clear

## Rollback Instructions

If issues are found, rollback is simple:

1. Revert the changes in `src/App.tsx`:
   ```typescript
   // Remove these lines:
   import AdminDashboard from "./pages/AdminDashboard";
   import AdminPhotoshootsEdit from "./pages/AdminPhotoshootsEdit";
   
   // Remove these routes:
   <Route path="/admin/dashboard" element={<AdminDashboard />} />
   <Route path="/admin/photoshoots/:category/edit" element={<AdminPhotoshootsEdit />} />
   ```

2. Revert `src/pages/Admin.tsx` to render WYSIWYGEditor directly

3. Delete new files:
   - `src/pages/AdminDashboard.tsx`
   - `src/pages/AdminPhotoshootsEdit.tsx`

4. Rebuild and redeploy

## Known Limitations

- Authentication required to access admin pages (by design)
- Pre-existing lint warnings in codebase (unrelated to this migration)
- Requires active Supabase connection

## Success Criteria

✅ All checklist items pass
✅ No new console errors
✅ Build succeeds without TypeScript errors
✅ All existing functionality preserved
✅ User can navigate between dashboard and edit pages seamlessly
✅ Data integrity maintained

## Testing Environment

- Node.js: v18+
- Package Manager: npm
- Build Tool: Vite
- Framework: React 18 + TypeScript
- UI Library: shadcn/ui
- Database: Supabase
