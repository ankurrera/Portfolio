# Social Links Feature - Testing Guide

## Overview
This document provides step-by-step instructions for testing the social links feature on the About page.

## Prerequisites
1. Database migrations must be applied
2. Admin user credentials
3. Access to Supabase dashboard (optional, for verification)

## Testing Checklist

### 1. Database Setup
Run the migration:
```bash
# Apply the migration (if using Supabase CLI)
supabase migration up
```

Or manually run the SQL from:
`supabase/migrations/20251228090000_create_social_links_table.sql`

Verify tables were created:
- `social_links` (with 5 initial rows)
- `resume_download_logs`

### 2. Admin Dashboard Testing

#### A. Access Admin Panel
1. Navigate to `/admin/login`
2. Log in with admin credentials
3. Go to Dashboard → About Page

#### B. Social Links Management
1. Scroll to "Social & Professional Links" section
2. Verify all 5 link types are displayed:
   - Resume
   - GitHub
   - LinkedIn
   - X (Twitter)
   - Telegram

#### C. Add/Update Links
For each link type:
1. Toggle "Visible" switch to ON
2. Enter a valid URL:
   - Resume: Upload a PDF or enter URL
   - GitHub: `https://github.com/username`
   - LinkedIn: `https://linkedin.com/in/username`
   - Twitter: `https://twitter.com/username`
   - Telegram: `https://t.me/username`
3. Click "Save Changes"
4. Verify success toast appears

#### D. Resume PDF Upload
1. Click "Upload PDF" button for Resume
2. Select a PDF file (max 10MB)
3. Verify upload progress
4. Verify URL is auto-filled with uploaded file URL

#### E. Drag-to-Reorder
1. Grab any social link item by the grip icon
2. Drag it to a different position
3. Drop to reorder
4. Click "Save Changes"
5. Verify new order is persisted

#### F. Visibility Toggle
1. Toggle "Visible" OFF for one link
2. Save changes
3. Navigate to public About page
4. Verify only visible links appear

### 3. Public About Page Testing

#### A. View Social Links
1. Navigate to `/about` page (logged out)
2. Scroll to profile picture
3. Verify social icons appear below the image
4. Icons should be in a horizontal row
5. Verify correct icons for each link type

#### B. Hover Effects
1. Hover over each icon
2. Verify hover effects:
   - Background changes to foreground color
   - Text color inverts
   - Icon scales up (1.1x)
   - Smooth transition animation

#### C. Click Behavior
1. Click each social link
2. Verify:
   - Opens in new tab
   - Has `rel="noopener noreferrer"`
   - Navigates to correct URL

#### D. Resume Download Tracking
1. Click the Resume icon
2. Verify:
   - Download/navigation happens immediately (non-blocking)
   - No delay or loading state
3. Return to admin dashboard
4. Check Resume Analytics section
5. Verify download was logged:
   - Total downloads increased
   - "Today" count increased
   - Entry appears in "Recent Downloads" table

### 4. Resume Analytics Testing

#### A. View Analytics
1. In Admin Dashboard → About Page
2. Scroll to "Resume Analytics" section
3. Verify displays:
   - Total Downloads
   - Today
   - Last 7 Days
   - Last 30 Days

#### B. Recent Downloads Table
1. Verify table shows:
   - Date & Time (formatted)
   - Referrer ("about")
2. Test with multiple downloads
3. Verify table updates in real-time
4. Verify max 10 entries shown

### 5. Responsive Design Testing

#### A. Mobile View (< 768px)
1. Resize browser to mobile width
2. Verify:
   - Icons still display in horizontal row
   - Icons are appropriately sized
   - Hover effects work on touch
   - No layout overflow

#### B. Tablet View (768px - 1024px)
1. Resize to tablet width
2. Verify layout adapts properly
3. Icons remain visible and accessible

#### C. Desktop View (> 1024px)
1. Full desktop width
2. Verify icons are centered
3. Proper spacing maintained

### 6. Accessibility Testing

#### A. Keyboard Navigation
1. Tab through social links
2. Verify each icon is focusable
3. Press Enter on focused icon
4. Verify link opens

#### B. Screen Reader
1. Use screen reader (or inspect aria-labels)
2. Verify each icon has proper `aria-label`
3. Verify `title` attribute for tooltips

#### C. Focus Indicators
1. Tab to social links
2. Verify visible focus indicator
3. Verify focus order is logical

### 7. Edge Cases

#### A. No Links Configured
1. Set all links to invisible in admin
2. Save changes
3. Visit About page
4. Verify social links section doesn't appear

#### B. Invalid URLs
1. In admin, enter invalid URL
2. Save and try clicking on public page
3. Verify browser handles gracefully

#### C. Resume - Both Upload and URL
1. Upload a PDF
2. Also enter a manual URL
3. Verify manual URL takes precedence

#### D. Large PDF Upload
1. Try uploading PDF > 10MB
2. Verify error message appears
3. Upload is rejected

### 8. Integration Testing

#### A. Existing About Page Layout
1. Verify no layout shifts
2. Typography unchanged
3. Spacing preserved
4. Animations still work
5. Other sections unaffected

#### B. Admin Dashboard Integration
1. Verify other admin sections still work
2. Navigation is unaffected
3. Save/Cancel buttons work properly

### 9. Performance Testing

#### A. Resume Download Tracking
1. Click Resume link
2. Measure time to download start
3. Verify < 50ms delay (non-blocking)
4. Check browser console for errors

#### B. Page Load Performance
1. Load About page with DevTools open
2. Check Network tab
3. Verify social_links query is efficient
4. No unnecessary re-fetches

### 10. Security Testing

#### A. RLS Policies
1. Log out completely
2. Try to access social_links table directly
3. Verify only visible links are returned
4. Verify cannot UPDATE or DELETE

#### B. Resume Download Logs
1. Verify unauthenticated users can INSERT
2. Verify only admins can SELECT
3. No sensitive data in logs

## Expected Results

### Public Page
- ✅ Social icons appear below profile picture
- ✅ Icons are clickable and open in new tab
- ✅ Only visible links appear
- ✅ Resume downloads are tracked silently
- ✅ Hover effects work smoothly
- ✅ Fully responsive on all devices
- ✅ Accessible with keyboard and screen readers

### Admin Dashboard
- ✅ All social links are editable
- ✅ Visibility toggles work
- ✅ Drag-to-reorder works smoothly
- ✅ Resume PDF upload works
- ✅ Analytics display correctly
- ✅ Changes persist after save

## Troubleshooting

### Icons Not Showing
- Check if links are set to visible
- Verify URLs are not empty
- Check browser console for errors

### Resume Analytics Not Updating
- Verify RLS policies are correct
- Check if INSERT policy uses WITH CHECK
- Verify user_agent is captured

### Upload Failing
- Check Supabase Storage bucket permissions
- Verify 'photos' bucket exists
- Check file size limit

### Drag-to-Reorder Not Working
- Check if draggable attribute is set
- Verify onDragStart/onDrop handlers
- Check for CSS conflicts

## Success Criteria
- [x] All 5 social link types can be managed
- [x] Drag-to-reorder works smoothly with visual feedback
- [x] Resume uploads work for PDF files
- [x] Download tracking is non-blocking and accurate
- [x] Analytics show correct metrics
- [x] Public page displays links correctly
- [x] Fully responsive on all screen sizes
- [x] Accessible to keyboard and screen reader users
- [x] No performance degradation
- [x] Existing About page layout unchanged
