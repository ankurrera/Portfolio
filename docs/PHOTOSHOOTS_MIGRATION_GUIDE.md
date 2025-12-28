# Photoshoots Parent Page Migration Guide

## Overview

This migration introduces a new "Photoshoots" parent page that consolidates all photography category pages (SELECTED, COMMISSIONED, EDITORIAL, PERSONAL) under a single hierarchy. This improves site navigation, SEO structure, and user experience.

## What Changed

### URL Structure

**Before:**
- `/category/selected`
- `/category/commissioned`
- `/category/editorial`
- `/category/personal`

**After:**
- `/photoshoots` (new parent page)
- `/photoshoots/selected`
- `/photoshoots/commissioned`
- `/photoshoots/editorial`
- `/photoshoots/personal`

### Navigation

- **Desktop**: New "Photoshoots" dropdown menu in header with all four categories
- **Mobile**: Photoshoots parent with indented category links
- All navigation links updated to use new routes

### SEO & Redirects

- 301 permanent redirects from old `/category/*` URLs to new `/photoshoots/*` URLs
- Updated sitemap.xml with new URL structure
- Updated canonical URLs and structured data (JSON-LD)
- All old URLs automatically redirect to preserve SEO and backlinks

## Files Changed

### New Files
- `src/pages/Photoshoots.tsx` - Parent page listing all photoshoot categories

### Modified Files
- `src/App.tsx` - Updated routing with new paths and redirects
- `src/components/PortfolioHeader.tsx` - Added Photoshoots dropdown navigation
- `src/pages/CategoryGallery.tsx` - Added redirect handling and updated SEO URLs
- `public/sitemap.xml` - Updated with new URL structure
- `vercel.json` - Added 301 redirects for old routes

## Database Impact

**None** - This is a frontend-only change. No database migrations required.
- Admin dashboard continues to work unchanged
- Photo categories remain the same in the database
- No data migration needed

## Backward Compatibility

✅ **Full backward compatibility maintained**
- Old URLs (`/category/*`) automatically redirect to new URLs (`/photoshoots/*`)
- 301 redirects preserve SEO rankings and backlinks
- Admin functionality unchanged
- All existing photo data works without modification

## Deployment Steps

### 1. Pre-Deployment

```bash
# Backup (optional, recommended for production)
# This is a low-risk change with no database modifications

# Pull latest changes
git pull origin [branch-name]

# Install dependencies (if needed)
npm install

# Build locally to verify
npm run build
```

### 2. Deployment

```bash
# Deploy to Vercel (or your hosting platform)
# The vercel.json redirects will automatically handle old URLs
vercel --prod

# Or push to main branch if auto-deploy is configured
git push origin main
```

### 3. Post-Deployment Verification

See the QA Checklist below for comprehensive testing steps.

## Rollback Plan

If issues arise, rollback is straightforward:

### Option 1: Git Revert (Recommended)

```bash
# Revert the commit
git revert [commit-hash]
git push origin main

# Redeploy
vercel --prod
```

### Option 2: Direct Code Rollback

1. Restore previous versions of modified files
2. Remove `src/pages/Photoshoots.tsx`
3. Rebuild and redeploy

### Rollback Impact

- Old routes will work again immediately
- New `/photoshoots/*` URLs will 404 (but these shouldn't be indexed yet)
- No database rollback needed (no database changes were made)
- No data loss

## QA Checklist

### ✅ Automated Tests
- [x] Build completes without errors
- [x] No TypeScript compilation errors
- [ ] All routes resolve correctly (manual testing required)

### ✅ Manual Testing Required

#### Page Accessibility
- [ ] Visit `/photoshoots` - Parent page loads and displays all 4 categories
- [ ] Visit `/photoshoots/selected` - Page loads with gallery
- [ ] Visit `/photoshoots/commissioned` - Page loads with gallery
- [ ] Visit `/photoshoots/editorial` - Page loads with gallery
- [ ] Visit `/photoshoots/personal` - Page loads with gallery

#### Redirects (Critical for SEO)
- [ ] Visit `/category/selected` - Redirects to `/photoshoots/selected` (301)
- [ ] Visit `/category/commissioned` - Redirects to `/photoshoots/commissioned` (301)
- [ ] Visit `/category/editorial` - Redirects to `/photoshoots/editorial` (301)
- [ ] Visit `/category/personal` - Redirects to `/photoshoots/personal` (301)

#### Navigation
- [ ] Desktop: "Photoshoots" link visible in header
- [ ] Desktop: Hover over "Photoshoots" shows dropdown with 4 categories
- [ ] Desktop: Clicking category in dropdown navigates correctly
- [ ] Mobile: Open menu shows "Photoshoots" parent
- [ ] Mobile: Category links are indented/grouped under Photoshoots
- [ ] Mobile: All category links navigate correctly

#### Gallery & Functionality
- [ ] Photos load correctly on all category pages
- [ ] Lightbox opens when clicking photos
- [ ] Photo metadata displays correctly in lightbox
- [ ] Navigation between photos works in lightbox
- [ ] Close lightbox works correctly

#### Admin Dashboard
- [ ] Login to admin at `/admin`
- [ ] Select each category (selected, commissioned, editorial, personal)
- [ ] Upload a test photo to each category
- [ ] Edit existing photos
- [ ] Verify WYSIWYG editor works correctly
- [ ] Publish changes
- [ ] Visit corresponding public page to verify changes appear

#### SEO & Meta Tags
- [ ] View page source on `/photoshoots` - Check canonical URL
- [ ] View page source on `/photoshoots/selected` - Check canonical URL
- [ ] Verify no duplicate canonical tags
- [ ] Check structured data (JSON-LD) is valid
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Sitemap includes new photoshoots URLs
- [ ] Run Lighthouse SEO audit - Should pass with no regressions

#### Cross-Browser Testing
- [ ] Chrome/Edge: All functionality works
- [ ] Firefox: All functionality works  
- [ ] Safari: All functionality works
- [ ] Mobile Safari (iOS): All functionality works
- [ ] Chrome Mobile (Android): All functionality works

#### Performance
- [ ] Page load times acceptable (no regressions)
- [ ] Images load progressively
- [ ] No console errors or warnings
- [ ] Network tab shows proper status codes (200 for pages, 301 for redirects)

## Feature Flag (Optional)

This migration does not include a feature flag, as it's a straightforward route change with redirects. However, if you want to test on staging first:

1. Deploy to staging environment
2. Run full QA checklist
3. Monitor for 24-48 hours
4. Deploy to production

## SEO Considerations

### Google Search Console
- 301 redirects will be detected automatically
- Old URLs will gradually transfer authority to new URLs (usually 1-2 weeks)
- Monitor Search Console for any crawl errors after deployment
- Submit updated sitemap.xml to Google Search Console

### Expected Behavior
- Old `/category/*` URLs will show as redirects in Search Console
- New `/photoshoots/*` URLs will begin appearing in search results
- Link equity preserved through 301 redirects
- No loss of rankings expected

### Timeline
- **Day 1-3**: Redirects detected by search engines
- **Week 1-2**: Old URLs gradually replaced in search results
- **Week 3-4**: New URLs fully indexed and ranking

## Support & Troubleshooting

### Common Issues

**Issue**: Old category URLs not redirecting
**Solution**: Check vercel.json is deployed and redirects are configured correctly

**Issue**: Navigation dropdown not showing
**Solution**: Clear browser cache, check for JavaScript errors in console

**Issue**: Photos not loading on new routes
**Solution**: Verify database category values haven't changed (they shouldn't have)

**Issue**: Admin dashboard not working
**Solution**: Admin uses categories, not routes - should be unaffected. Check console for errors.

### Monitoring

After deployment, monitor:
- Error rates in application logs
- 404 errors in web server logs
- User feedback/support tickets
- Google Analytics: Check for 301 redirect tracking
- Google Search Console: Monitor crawl status

## Success Criteria

✅ Migration is successful when:
- All new routes are accessible and functional
- All old routes redirect with 301 status
- Navigation works on desktop and mobile
- Admin dashboard functionality unchanged
- No increase in error rates
- No SEO ranking drops after 2 weeks

## Rollback Triggers

Consider rolling back if:
- Critical functionality broken (photos not loading, admin broken)
- High volume of 404 errors (indicates redirect failure)
- Significant SEO ranking drops within first week
- User-reported issues affecting >10% of traffic

## Questions?

For issues or questions about this migration, contact the development team or create an issue in the repository.
