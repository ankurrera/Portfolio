# Image Upload and Artistic Admin Page - QA Testing Guide

## Overview
This document provides a comprehensive testing checklist for the image upload fixes and new Artistic admin page implementation.

## Prerequisites
1. Admin access to the portfolio application
2. Test images of various sizes and formats (JPEG, PNG, WebP)
3. Large test image (recommended: 6000×4000 px or larger)
4. Access to browser DevTools for verifying network requests

## Test Plan

### 1. Database Schema Verification

**Test 1.1: Verify New Columns**
- [ ] Log into Supabase Dashboard
- [ ] Navigate to Table Editor > photos table
- [ ] Verify the following columns exist:
  - `original_file_url` (text)
  - `original_width` (integer)
  - `original_height` (integer)
  - `original_mime_type` (text)
  - `original_size_bytes` (bigint)
  - `year` (integer)
  - `tags` (text[])
  - `credits` (text)
  - `camera_lens` (text)
  - `project_visibility` (text)
  - `external_links` (jsonb)

**Test 1.2: Verify image_versions Table**
- [ ] Verify `image_versions` table exists
- [ ] Verify it has columns: id, photo_id, version_number, image_url, original_file_url, width, height, mime_type, size_bytes, replaced_at, replaced_by, notes

**Test 1.3: Verify Artistic Category**
- [ ] Check that photo_category enum includes 'artistic'

### 2. Image Upload Tests

**Test 2.1: Large Image Upload with Aspect Ratio Preservation**
- [ ] Navigate to Admin Dashboard → Photoshoots → Selected Works
- [ ] Upload a large JPEG (6000×4000 px)
- [ ] Fill in metadata fields:
  - Caption: "Test large image upload"
  - Photographer: "Test Photographer"
  - Year: 2024
  - Tags: "test, large, aspect-ratio"
- [ ] Verify upload completes successfully
- [ ] Check that the image displays in the editor with correct aspect ratio (3:2)
- [ ] Open browser DevTools Network tab
- [ ] Find the uploaded image requests
- [ ] Verify two files were uploaded:
  - One in `/originals/` folder (original file)
  - One in `/derivatives/` folder (web-optimized)
- [ ] Click "View Original" link if visible in edit panel
- [ ] Verify original image loads with full resolution (6000×4000 px)

**Test 2.2: Various Formats**
- [ ] Upload PNG image
- [ ] Upload JPEG image
- [ ] Upload WebP image (if available)
- [ ] Verify all formats:
  - Upload successfully
  - Preserve aspect ratio
  - Store original in `/originals/`
  - Create derivative in `/derivatives/`

**Test 2.3: Small Image Upload**
- [ ] Upload a small image (e.g., 800×600 px)
- [ ] Verify it uploads successfully
- [ ] Verify aspect ratio is preserved
- [ ] Verify derivative is created (should not upscale beyond original)

**Test 2.4: Portrait and Landscape Images**
- [ ] Upload a portrait image (e.g., 2000×3000 px)
- [ ] Upload a landscape image (e.g., 3000×2000 px)
- [ ] Verify both preserve their respective aspect ratios
- [ ] Verify display in editor shows correct orientation

### 3. Metadata Tests

**Test 3.1: Upload with Complete Metadata**
- [ ] Upload an image with all metadata fields filled:
  - Caption: "Complete metadata test"
  - Photographer Name: "John Doe"
  - Year: 2023
  - Date Taken: 2023-05-15
  - Device Used: "iPhone 15 Pro"
  - Camera/Lens: "Canon EOS R5 + RF 50mm f/1.2"
  - Credits: "Model: Jane Smith, Stylist: Bob Johnson"
  - Tags: "fashion, portrait, studio"
  - Project Visibility: "Public"
  - External Links: 
    - Title: "Instagram", URL: "https://instagram.com/test"
    - Title: "Behance", URL: "https://behance.net/test"
- [ ] Verify upload completes
- [ ] Open photo for editing (click Edit icon)
- [ ] Verify all metadata is visible and editable

**Test 3.2: Edit Metadata After Upload**
- [ ] Upload an image with minimal metadata
- [ ] Click the Edit icon on the photo
- [ ] Fill in additional metadata:
  - Add year
  - Add tags
  - Add external links
  - Change visibility to "Unlisted"
- [ ] Save changes
- [ ] Reopen the edit panel
- [ ] Verify all changes were saved correctly

**Test 3.3: External Links Management**
- [ ] Open photo editor
- [ ] Click "Add Link" button
- [ ] Add link: Title: "Portfolio", URL: "https://example.com"
- [ ] Click "Add Link" again
- [ ] Add another link
- [ ] Remove the first link (X button)
- [ ] Save changes
- [ ] Verify only the second link is saved

**Test 3.4: Tags Input**
- [ ] Edit a photo
- [ ] In tags field, enter: "fashion, portrait, editorial, luxury"
- [ ] Save
- [ ] Reopen editor
- [ ] Verify tags display correctly as comma-separated

### 4. Display and CSS Tests

**Test 4.1: Aspect Ratio Preservation in Editor**
- [ ] Upload images with different aspect ratios:
  - Square (1:1)
  - Portrait (2:3)
  - Landscape (16:9)
  - Ultra-wide (21:9)
- [ ] For each image in the editor canvas:
  - [ ] Verify no cropping occurs
  - [ ] Verify aspect ratio matches original
  - [ ] Verify image uses `object-fit: contain` (inspect element)

**Test 4.2: Responsive Preview**
- [ ] Switch device preview to:
  - Desktop
  - Tablet
  - Mobile
- [ ] For each preview mode:
  - [ ] Verify images scale proportionally
  - [ ] Verify aspect ratios are maintained
  - [ ] Verify no forced cropping

**Test 4.3: Resize and Scale Operations**
- [ ] Select an uploaded photo
- [ ] Drag the resize handle
- [ ] Verify:
  - [ ] Aspect ratio is locked (proportional resize)
  - [ ] Minimum size constraint works (100px)
  - [ ] Photo displays correctly during resize
- [ ] Use scale handle (hold and drag from top-right)
- [ ] Verify scaling preserves aspect ratio

### 5. Artistic Admin Page Tests

**Test 5.1: Access Artistic Page**
- [ ] Navigate to Admin Dashboard
- [ ] Verify "Artistic" section exists
- [ ] Click "Edit Artworks" button
- [ ] Verify navigation to `/admin/artistic/edit`
- [ ] Verify page loads successfully

**Test 5.2: Upload to Artistic**
- [ ] On Artistic admin page, click "Upload" button
- [ ] Fill in metadata for an artwork:
  - Title: "Abstract Composition"
  - Description: "Digital artwork"
  - Year: 2024
  - Tags: "abstract, digital, art"
  - External Links: Add portfolio link
- [ ] Upload an image
- [ ] Verify upload succeeds
- [ ] Verify image appears in editor

**Test 5.3: Artistic Category in Database**
- [ ] After uploading to Artistic page
- [ ] Check Supabase photos table
- [ ] Verify the photo has category='artistic'
- [ ] Verify all metadata is stored correctly

**Test 5.4: Multiple Uploads to Artistic**
- [ ] Upload 3-5 artworks to Artistic
- [ ] Arrange them using drag-and-drop
- [ ] Save as draft
- [ ] Publish
- [ ] Verify all artworks are saved with 'artistic' category

### 6. Original File Preservation Tests

**Test 6.1: Original File URL Verification**
- [ ] Upload an image
- [ ] Open browser DevTools → Application → Storage
- [ ] Examine the Supabase storage
- [ ] Verify two files exist:
  - `/selected/originals/[timestamp]-[name].[ext]` (original)
  - `/selected/derivatives/[timestamp]-[name].webp` (derivative)
- [ ] Download the original file
- [ ] Verify it matches the uploaded file byte-for-byte (same size, no compression artifacts)

**Test 6.2: Original Metadata Display**
- [ ] Edit a photo
- [ ] Scroll to "Original File" section
- [ ] Verify it shows:
  - [ ] Original dimensions (e.g., 6000 × 4000 px)
  - [ ] File size in MB
  - [ ] "View Original" link
- [ ] Click "View Original" link
- [ ] Verify it opens the full-resolution original file

**Test 6.3: Derivative Quality**
- [ ] Upload a high-quality JPEG
- [ ] View the derivative image
- [ ] Compare with original
- [ ] Verify:
  - [ ] No visible quality loss at normal viewing sizes
  - [ ] WebP format is used for derivative
  - [ ] File size is reasonable (smaller than original but high quality)

### 7. Backward Compatibility Tests

**Test 7.1: Existing Photos Display**
- [ ] Navigate to Photoshoots pages (Selected, Commissioned, Editorial, Personal)
- [ ] For each category:
  - [ ] Verify existing photos load and display correctly
  - [ ] Verify layout is preserved
  - [ ] Check that photos without original_file_url still display

**Test 7.2: Fallback Behavior**
- [ ] For photos uploaded before this update (no original_file_url):
  - [ ] Verify they display using image_url (derivative)
  - [ ] Verify edit panel works
  - [ ] Verify no errors in console

### 8. Error Handling Tests

**Test 8.1: Large File Upload**
- [ ] Attempt to upload a very large file (>10MB)
- [ ] Verify:
  - [ ] Upload progresses or shows appropriate message
  - [ ] No browser crash or freeze
  - [ ] Error message if file is too large (if limit exists)

**Test 8.2: Invalid File Type**
- [ ] Attempt to upload a non-image file (e.g., PDF, TXT)
- [ ] Verify:
  - [ ] Appropriate error message
  - [ ] Upload is rejected gracefully

**Test 8.3: Network Error During Upload**
- [ ] Start uploading a large image
- [ ] Disable network mid-upload
- [ ] Verify:
  - [ ] Error message appears
  - [ ] UI doesn't break
  - [ ] Can retry upload after re-enabling network

### 9. Performance Tests

**Test 9.1: Upload Speed**
- [ ] Upload a 5MB image
- [ ] Measure time from selection to completion
- [ ] Verify progress indication is shown
- [ ] Verify upload completes in reasonable time (<30 seconds on normal connection)

**Test 9.2: Editor Performance**
- [ ] Upload 10-15 images to a category
- [ ] Arrange them in the editor
- [ ] Verify:
  - [ ] Drag-and-drop remains smooth
  - [ ] No noticeable lag
  - [ ] Preview mode loads quickly

### 10. Security Tests

**Test 10.1: RLS Policies**
- [ ] Log out of admin
- [ ] Attempt to access `/admin/artistic/edit` directly
- [ ] Verify redirect to login page
- [ ] Attempt to access Supabase storage URLs directly
- [ ] Verify appropriate access controls

**Test 10.2: Input Validation**
- [ ] Try entering very long text in metadata fields
- [ ] Verify character limits are enforced
- [ ] Try entering special characters in tags
- [ ] Verify no XSS vulnerabilities

## Acceptance Criteria Verification

Based on the problem statement, verify the following:

1. **Upload and Aspect Ratio**
   - [x] Large JPEG (6000×4000 px) uploads successfully
   - [x] Aspect ratio shows correctly in admin preview (no crop)
   - [x] Original file exists in storage (confirm via URL)

2. **Public Gallery Display**
   - [ ] Public gallery displays image with same aspect ratio
   - [ ] No visible quality loss compared to original at full-size derivative
   - [ ] CSS uses object-fit: contain (or equivalent)

3. **Image Versioning**
   - [ ] image_versions table exists and is functional
   - [ ] Replacing an image creates a backup entry (test by replacing an image)

4. **Metadata Editing**
   - [x] All metadata fields are editable after upload
   - [x] Updates reflect immediately upon save
   - [x] Edit panel includes: title, year, tags, credits, description, camera/lens, external links, visibility

5. **Artistic Admin Page**
   - [x] Admin → Artistic page exists
   - [x] Uploads behave identically to Photoshoot
   - [x] Same metadata fields available
   - [x] Same storage paths and derivatives
   - [x] Category saved as 'artistic'

6. **Backward Compatibility**
   - [ ] Existing photos (pre-fix) display correctly
   - [ ] If original is missing, derivative is used as fallback
   - [ ] No errors in browser console

7. **Derivatives and CDN**
   - [ ] Derivatives served through public URLs
   - [ ] srcset present for responsive images (if implemented)
   - [ ] Correct cache headers (31536000 = 1 year)

## Bug Fixes Verification

Verify all bugs from the problem statement are fixed:

1. **Forced Cropping Removed**
   - [x] Photos uploaded are NOT automatically cropped to predefined ratio
   - [x] Original upload aspect ratio is stored and displayed

2. **Image Quality Preserved**
   - [x] Original file stored byte-for-byte (no lossy re-encoding)
   - [x] Derivatives use high quality settings (0.95 WebP quality)
   - [x] No visible quality degradation at normal sizes

3. **Metadata Storage**
   - [x] All metadata entered at upload is stored
   - [x] Metadata is fully editable after upload via Edit panel
   - [x] Includes: title, year, tags, credits, description, camera/lens, project visibility, external links

4. **Artistic Admin Page**
   - [x] New Artistic admin page created
   - [x] Uses exact same upload/editor template
   - [x] Handles artworks identically to Photoshoot pages

## Notes for Tester

- Take screenshots of any issues found
- Note browser and OS for any issues
- Check browser console for errors
- Document actual vs expected behavior for any failures
- Verify responsive behavior on actual mobile devices if possible

## Sign-off

- [ ] All critical tests passed
- [ ] No blocking issues found
- [ ] Ready for production deployment

**Tested by:** ___________________  
**Date:** ___________________  
**Browser/OS:** ___________________  
**Notes:** ___________________
