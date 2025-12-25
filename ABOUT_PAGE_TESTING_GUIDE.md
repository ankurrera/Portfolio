# About Page Management - Testing Guide

## Prerequisites
1. Have admin credentials for the portfolio site
2. Access to the Supabase database console (optional, for verification)
3. A test profile image (JPG, PNG, etc., under 5MB)

## Test Scenarios

### 1. Database Migration Test
**Goal:** Verify that the migration creates the table and populates initial data

**Steps:**
1. Run the migration: `supabase migration up`
2. Check that the `about_page` table exists
3. Verify the initial data row was inserted
4. Confirm RLS policies are active

**Expected Result:**
- Table `about_page` exists
- One row with bio text and 5 services
- RLS enabled with 4 policies

---

### 2. Admin Dashboard Access Test
**Goal:** Verify the About Page section appears in admin dashboard

**Steps:**
1. Navigate to `/admin/login`
2. Log in with admin credentials
3. View the Admin Dashboard at `/admin/dashboard`
4. Locate the "About Page" section

**Expected Result:**
- "About Page" card appears with User icon
- Card shows description: "Manage profile image, bio, and services for the About page"
- Clicking card navigates to `/admin/about/edit`

---

### 3. Profile Image Upload Test
**Goal:** Test uploading and managing profile images

**Steps:**
1. Navigate to `/admin/about/edit`
2. Click "Choose File" for profile image
3. Select a test image (valid format, under 5MB)
4. Wait for upload to complete
5. Verify image preview appears
6. Click "Save Changes"
7. Visit `/about` to confirm image displays

**Test Cases:**
- ✓ Valid image upload (JPG, PNG, GIF, WebP)
- ✓ Large file rejection (> 5MB)
- ✓ Non-image file rejection
- ✓ Replace existing image
- ✓ Remove image (X button)

**Expected Result:**
- Valid images upload successfully
- Invalid files show error toast
- Image appears on About page
- Replace and remove work correctly

---

### 4. Bio Text Edit Test
**Goal:** Test editing bio/description text

**Steps:**
1. Navigate to `/admin/about/edit`
2. Edit the bio text in the textarea
3. Add multiple paragraphs (separated by Enter)
4. Check character counter updates
5. Click "Save Changes"
6. Visit `/about` to verify changes

**Test Cases:**
- ✓ Single paragraph text
- ✓ Multi-paragraph text with line breaks
- ✓ 2000 character limit enforcement
- ✓ Character counter accuracy
- ✓ Empty bio handling

**Expected Result:**
- Text saves successfully
- Line breaks preserved on About page
- Character counter shows remaining chars
- Changes appear on public page

---

### 5. Services Management Test
**Goal:** Test CRUD operations on services

**Steps:**
1. Navigate to `/admin/about/edit`
2. Click "Add Service"
3. Fill in title and description
4. Add multiple services
5. Edit an existing service
6. Reorder services (up/down arrows)
7. Delete a service
8. Click "Save Changes"
9. Visit `/about` to verify

**Test Cases:**
- ✓ Add new service
- ✓ Edit service title
- ✓ Edit service description
- ✓ Move service up
- ✓ Move service down
- ✓ Delete service
- ✓ Save empty services list

**Expected Result:**
- Services appear in order on About page
- All CRUD operations work
- Reordering updates display order
- Deleted services don't appear

---

### 6. Live Update Test (Real-time)
**Goal:** Verify changes reflect instantly without page refresh

**Steps:**
1. Open `/about` in one browser window
2. Open `/admin/about/edit` in another window (same browser or different)
3. Make a change in admin (e.g., update bio text)
4. Click "Save Changes"
5. **Without refreshing**, check the `/about` window

**Expected Result:**
- Changes appear on `/about` within 1-2 seconds
- No page refresh needed
- Real-time subscription working

---

### 7. Security Test (RLS Policies)
**Goal:** Verify Row Level Security policies work correctly

**Test Cases:**

**Public Read Access:**
1. Open `/about` without logging in
2. Verify page loads and displays content

**Admin Write Access:**
1. Log in as non-admin user (if available)
2. Try to access `/admin/about/edit`
3. Should be redirected to login

**Database Level:**
1. Try to insert/update via Supabase client without auth
2. Should fail with RLS error

**Expected Result:**
- Public can view About page
- Only admins can access admin panel
- Database enforces RLS

---

### 8. Error Handling Test
**Goal:** Test error states and user feedback

**Test Cases:**
1. **Network Error:** Disconnect internet, try to save
2. **Invalid Data:** Try uploading invalid file
3. **Empty State:** Delete all services, save, check display
4. **Cancel:** Make changes, click Cancel, verify no save

**Expected Result:**
- Error toasts appear for failures
- Loading states show during operations
- Cancel discards changes
- Graceful degradation

---

### 9. Fallback Content Test
**Goal:** Test fallback when database is empty

**Steps:**
1. Delete the row from `about_page` table (use Supabase console)
2. Visit `/about`
3. Verify fallback content displays

**Expected Result:**
- Default bio text appears
- Default services list appears
- No errors or crashes

---

### 10. Navigation Test
**Goal:** Test navigation between pages

**Test Cases:**
1. Dashboard → About Edit → Dashboard (Back button)
2. Dashboard → About Edit → Cancel button
3. About Edit → Save → Dashboard
4. Direct URL access: `/admin/about/edit`

**Expected Result:**
- All navigation works smoothly
- No broken links
- Breadcrumbs/navigation clear

---

## Performance Tests

### Load Time Test
**Steps:**
1. Clear browser cache
2. Navigate to `/about`
3. Measure page load time
4. Check for loading indicators

**Expected Result:**
- Page loads within 2-3 seconds
- Loading spinner shows while fetching
- Smooth transition to content

---

## Regression Tests

### Existing Functionality Test
**Goal:** Ensure existing About page features still work

**Test Cases:**
1. ✓ Hero section displays
2. ✓ Contact form works
3. ✓ Header navigation works
4. ✓ Footer displays
5. ✓ Responsive layout on mobile
6. ✓ SEO metadata correct

**Expected Result:**
- No existing features broken
- Layout preserved
- All interactions work

---

## Browser Compatibility

Test on:
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile Safari (iOS)
- ✓ Mobile Chrome (Android)

---

## Build Test

**Steps:**
```bash
npm run build
npm run preview
```

**Expected Result:**
- Build completes without errors
- No TypeScript errors
- No console errors
- Preview works correctly

---

## Deployment Test (Post-Merge)

1. **Migration Test:**
   - Verify migration runs on production Supabase
   - Check data seeded correctly

2. **Vercel/Production Test:**
   - Visit production `/admin/about/edit`
   - Make a test change
   - Verify appears on production `/about`
   - Revert test change

---

## Test Checklist Summary

- [ ] Database migration successful
- [ ] Admin dashboard card appears
- [ ] Profile image upload works
- [ ] Bio text edit works
- [ ] Services CRUD works
- [ ] Live updates work (real-time)
- [ ] RLS policies enforced
- [ ] Error handling works
- [ ] Fallback content displays
- [ ] Navigation works
- [ ] Load time acceptable
- [ ] No regressions
- [ ] Cross-browser compatible
- [ ] Build successful
- [ ] Ready for deployment

---

## Troubleshooting

### Issue: Changes don't appear on About page
**Solution:** Check browser console for Supabase errors, verify RLS policies

### Issue: Image upload fails
**Solution:** Check file size (<5MB), verify Supabase Storage bucket exists

### Issue: Real-time updates not working
**Solution:** Check Supabase Realtime is enabled, verify subscription in browser console

### Issue: Admin access denied
**Solution:** Verify user has 'admin' role in `user_roles` table

---

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Build completes successfully
✅ Real-time updates work
✅ Security policies enforced
✅ Documentation complete
