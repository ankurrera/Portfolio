# Hero Section CMS Implementation - Testing & Deployment Guide

## Overview
This implementation makes all hero sections across the portfolio website fully dynamic and CMS-driven using Supabase.

## Database Migration
The migration file `20251225194900_create_hero_text_table.sql` needs to be applied to Supabase:

### Option 1: Using Supabase CLI
```bash
supabase db push
```

### Option 2: Using Supabase Dashboard
1. Navigate to your Supabase project dashboard
2. Go to SQL Editor
3. Paste the contents of `supabase/migrations/20251225194900_create_hero_text_table.sql`
4. Click "Run"

## Seed Data
The migration includes seed data for all existing pages:
- `home` - Index page hero
- `about` - About page hero
- `artistic` - Artistic page hero
- `technical` - Technical page hero
- `photoshoots` - Photoshoots page hero
- `achievement` - Achievement page hero

## Testing Checklist

### 1. Backend Testing (Supabase)
- [ ] Verify `hero_text` table exists in Supabase
- [ ] Confirm RLS policies are active:
  - [ ] Public SELECT works (test in browser console)
  - [ ] Admin INSERT works (test in admin panel)
  - [ ] Admin UPDATE works (test in admin panel)
  - [ ] Admin DELETE works (test in admin panel)
- [ ] Verify unique constraint on `page_slug` (try adding duplicate)
- [ ] Verify `updated_at` trigger updates timestamp on edit

### 2. Admin Dashboard Testing
Navigate to `/admin/hero/edit` (requires admin login):

#### List View
- [ ] All hero sections display correctly
- [ ] Page names are readable
- [ ] Last updated timestamps show correctly
- [ ] Cards are clickable

#### Create Functionality
- [ ] Click "Add Hero Section"
- [ ] Fill in all fields with valid data:
  - Page slug: `test-page`
  - Hero title: `Test Title`
  - Hero subtitle: `TEST SUBTITLE`
  - Hero description: `This is a test description`
  - CTA text: `Click Here`
  - CTA link: `/contact`
- [ ] Verify validation works:
  - [ ] Empty page slug shows error
  - [ ] Invalid page slug format shows error
  - [ ] Empty hero title shows error
  - [ ] Character limits are enforced
  - [ ] Invalid CTA link shows error
- [ ] Click "Create" and verify success toast
- [ ] Verify new entry appears in list

#### Edit Functionality
- [ ] Click "Edit" on an existing entry
- [ ] Modify the hero title
- [ ] Verify page slug field is disabled (can't be changed)
- [ ] Click "Update" and verify success toast
- [ ] Verify changes persist after refresh

#### Preview Functionality
- [ ] Click the eye icon on any entry
- [ ] Verify preview shows all content correctly
- [ ] Check background image if set
- [ ] Verify CTA button displays if configured

#### Delete Functionality
- [ ] Click delete icon on test entry
- [ ] Verify confirmation modal appears
- [ ] Click "Delete" and verify success toast
- [ ] Verify entry is removed from list

### 3. Frontend Testing (Public Pages)

#### Home Page (/)
- [ ] Navigate to home page
- [ ] Verify hero section loads (may show loading spinner briefly)
- [ ] Confirm title displays: "Ankur Bag" (or custom from DB)
- [ ] Confirm subtitle displays: "FASHION PRODUCTION & PHOTOGRAPHY"
- [ ] Confirm description is readable
- [ ] Check responsive design on mobile
- [ ] Verify no console errors

#### About Page (/about)
- [ ] Navigate to about page
- [ ] Verify hero section loads with portrait
- [ ] Confirm title and subtitle are dynamic
- [ ] Portrait image loads correctly below hero text
- [ ] Page layout is intact (bio, services, contact form)

#### Artistic Page (/artistic)
- [ ] Navigate to artistic page
- [ ] Verify hero section loads
- [ ] Breadcrumbs work correctly
- [ ] Gallery displays below hero

#### Technical Page (/technical)
- [ ] Navigate to technical page
- [ ] Verify hero section loads
- [ ] Projects section displays correctly

#### Photoshoots Page (/photoshoots)
- [ ] Navigate to photoshoots page
- [ ] Verify hero section loads
- [ ] Category cards display correctly

#### Achievement Page (/achievement)
- [ ] Navigate to achievement page
- [ ] Verify hero section loads
- [ ] Achievement folders display correctly
- [ ] Proper spacing maintained (pt-24 for header clearance)

### 4. CTA Link Testing
Create a hero with CTA links and test:
- [ ] Internal link (e.g., `/contact`) - should use React Router (no page reload)
- [ ] External link (e.g., `https://google.com`) - should open in new tab

### 5. Fallback Testing
- [ ] Create a new page route that doesn't have hero text in DB
- [ ] Verify fallback content displays
- [ ] Verify no errors in console
- [ ] Confirm loading state is brief

### 6. SEO & Accessibility
- [ ] Verify hero uses `<h1>` tag (check with browser inspector)
- [ ] Confirm proper heading hierarchy on all pages
- [ ] Test with screen reader if possible
- [ ] Verify semantic HTML structure

### 7. Responsive Design
Test on various screen sizes:
- [ ] Mobile (320px - 640px)
- [ ] Tablet (641px - 1024px)
- [ ] Desktop (1025px+)
- [ ] Ultra-wide (1600px+)

### 8. Performance
- [ ] Check Network tab for hero_text queries
- [ ] Verify queries are fast (< 500ms)
- [ ] Confirm no duplicate queries
- [ ] Check for layout shift (should be minimal)

## Deployment Steps

### 1. Database
1. Apply the migration to production Supabase instance
2. Verify seed data is present
3. Test RLS policies in production

### 2. Frontend
1. Ensure environment variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Build the application: `npm run build`
3. Deploy to Vercel/hosting platform
4. Verify deployment was successful

### 3. Post-Deployment
1. Test all pages in production
2. Verify admin login works
3. Test creating/editing hero sections
4. Monitor Supabase logs for any issues
5. Check error tracking (if configured)

## Rollback Plan
If issues occur:
1. Revert the database migration:
   ```sql
   DROP TABLE IF EXISTS public.hero_text;
   ```
2. Revert code changes to previous commit
3. Redeploy

## Common Issues & Solutions

### Issue: "supabaseUrl is required" error
**Solution**: Ensure `.env` file exists with proper Supabase credentials

### Issue: Hero doesn't load / shows fallback
**Solution**: 
1. Check browser console for errors
2. Verify Supabase connection
3. Check if hero_text record exists for that page_slug
4. Verify RLS policies allow public SELECT

### Issue: Can't edit hero sections in admin
**Solution**:
1. Verify user is admin (check `user_roles` table)
2. Check RLS policies for admin permissions
3. Clear browser cache and cookies

### Issue: Layout shifts when hero loads
**Solution**: This is expected briefly. The loading state shows a spinner. Content should settle within 500ms.

## Maintenance

### Adding Hero for New Page
1. Go to `/admin/hero/edit`
2. Click "Add Hero Section"
3. Fill in page slug (must match route)
4. Add title, subtitle, description
5. Optionally add CTA button
6. Click "Create"

### Updating Existing Hero
1. Go to `/admin/hero/edit`
2. Find the page you want to edit
3. Click "Edit" button
4. Modify fields as needed
5. Click "Update"

### Best Practices
- Keep hero titles concise (< 50 characters)
- Subtitles should be ALL CAPS and brief
- Descriptions should be 1-2 sentences
- CTA text should be action-oriented (e.g., "Get Started", "Learn More")
- Test changes on staging before production

## Support
For issues or questions:
1. Check browser console for errors
2. Check Supabase logs
3. Review this guide
4. Contact development team
