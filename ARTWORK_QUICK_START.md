# Artwork System - Quick Start Guide

## 🚀 Deployment Steps

### 1. Apply Database Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard SQL Editor
# Run the contents of:
# - supabase/migrations/20251212163000_create_artworks_table.sql
# - supabase/migrations/20251212163100_migrate_artistic_photos_to_artworks.sql
```

### 2. Verify Migrations Applied

In Supabase Dashboard → SQL Editor:

```sql
-- Check artworks table exists
SELECT COUNT(*) FROM artworks;

-- Check migration function exists
SELECT proname FROM pg_proc WHERE proname = 'migrate_artistic_photos_to_artworks';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'artworks';
```

Expected output:
- artworks table returns a count (likely 0 initially)
- Function exists
- 5 RLS policies shown

### 3. Run Migration Script

```bash
# Set environment variables (if not in .env)
export VITE_SUPABASE_URL="your_supabase_url"
export VITE_SUPABASE_ANON_KEY="your_anon_key"

# Run migration
node migrate-artworks.mjs
```

Expected output:
```
🎨 Artwork Migration Script

1. Checking artworks table...
✅ Artworks table exists

2. Counting artistic photos...
✅ Found X artistic photos

3. Checking existing artworks...
✅ Found 0 existing artworks

4. Running migration...
✅ Migration completed!
   - Migrated: X
   - Skipped: 0
   - Total: X

5. Verifying migration...
✅ Verification results:
   photos:
     - Record count: X
   artworks:
     - Record count: X
```

### 4. Deploy Frontend

```bash
# Build for production
npm run build

# Deploy to your hosting (e.g., Vercel)
vercel deploy --prod

# Or push to main to trigger automatic deployment
git push origin copilot/update-artistic-upload-edit-ui:main
```

## ✅ Testing Checklist

### Admin Features (at `/admin/artistic/edit`)

- [ ] **Login & Access**
  - [ ] Can login as admin
  - [ ] Page loads without errors
  - [ ] See migrated artworks on canvas

- [ ] **Upload New Artwork**
  - [ ] Click "Upload" button
  - [ ] Fill all metadata fields
  - [ ] Select primary image
  - [ ] Add process images
  - [ ] Toggle published on/off
  - [ ] Click "Upload Artwork"
  - [ ] Verify success message
  - [ ] See new artwork on canvas

- [ ] **Edit Artwork**
  - [ ] Hover over artwork
  - [ ] Click pencil icon
  - [ ] Side panel opens
  - [ ] Edit title
  - [ ] Edit description
  - [ ] Change materials
  - [ ] Toggle published
  - [ ] Click "Save Changes"
  - [ ] Verify success message

- [ ] **Layout Management**
  - [ ] Drag artwork to new position
  - [ ] Resize artwork (corner handle)
  - [ ] Click "Bring Forward"
  - [ ] Click "Send Backward"
  - [ ] Verify autosave (wait 2 seconds)
  - [ ] Refresh page to confirm save

- [ ] **Delete Artwork**
  - [ ] Click trash icon
  - [ ] Confirm deletion
  - [ ] Verify artwork removed

- [ ] **Device Preview**
  - [ ] Switch to Tablet view
  - [ ] Switch to Mobile view
  - [ ] Switch back to Desktop
  - [ ] Layout adjusts correctly

- [ ] **Preview Mode**
  - [ ] Switch to Preview mode
  - [ ] Drag disabled
  - [ ] Edit buttons hidden
  - [ ] Switch back to Edit mode

### Public Display (at `/artistic`)

- [ ] **Published Artworks**
  - [ ] See all published artworks
  - [ ] Layout matches admin preview
  - [ ] Images load correctly

- [ ] **Unpublished Artworks**
  - [ ] Create artwork, leave unpublished
  - [ ] Verify NOT visible on public page
  - [ ] Publish artwork
  - [ ] Verify NOW visible on public page

- [ ] **Lightbox**
  - [ ] Click on artwork
  - [ ] Lightbox opens
  - [ ] High-res image loads
  - [ ] Title displays
  - [ ] Creation date displays
  - [ ] Materials display
  - [ ] Copyright displays
  - [ ] Navigate to next/previous
  - [ ] Close lightbox (X or Esc)

### File Storage

- [ ] **Supabase Storage**
  - [ ] Go to Storage → photos bucket
  - [ ] Check `artworks/originals/` folder exists
  - [ ] Check `artworks/derivatives/` folder exists
  - [ ] Verify original file is preserved
  - [ ] Verify derivative is WebP format
  - [ ] Check process images in subdirectories

### Security

- [ ] **RLS Policies**
  - [ ] Logout from admin
  - [ ] Go to `/artistic` as public user
  - [ ] Can only see published artworks
  - [ ] Try to access unpublished artwork URL directly
  - [ ] Should be denied

- [ ] **Admin Access**
  - [ ] Try accessing `/admin/artistic/edit` as non-admin
  - [ ] Should redirect to login
  - [ ] Login as admin
  - [ ] Should access successfully

### Performance

- [ ] **Load Time**
  - [ ] Public page loads in < 3 seconds
  - [ ] Admin page loads in < 5 seconds

- [ ] **Upload Time**
  - [ ] Primary image uploads in reasonable time
  - [ ] Process images upload in reasonable time
  - [ ] Progress indicator shows

## 🐛 Common Issues & Fixes

### Migration Issues

**Problem**: "artworks table does not exist"
```bash
# Solution: Apply migrations first
supabase db push
```

**Problem**: "0 migrated"
```sql
-- Check if artistic photos exist
SELECT COUNT(*) FROM photos WHERE category = 'artistic';
```

**Problem**: Migration function not found
```sql
-- Re-run migration script
-- \i supabase/migrations/20251212163100_migrate_artistic_photos_to_artworks.sql
```

### Upload Issues

**Problem**: Upload fails silently
- Check browser console (F12) for errors
- Check Supabase logs in dashboard
- Verify storage bucket permissions

**Problem**: Images not displaying
- Check image URLs are accessible
- Verify files uploaded to correct paths
- Check browser network tab for 404s

### Display Issues

**Problem**: Artworks not showing
```sql
-- Check artworks exist and are published
SELECT id, title, is_published FROM artworks;
```

**Problem**: Layout looks different
- Clear browser cache
- Check z_index values
- Verify position_x, position_y values

### Permission Issues

**Problem**: Can't upload/edit
```sql
-- Check user role
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

**Problem**: Public can see unpublished
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'artworks';
```

## 📝 Post-Deployment Checklist

- [ ] Migration completed successfully
- [ ] All tests passed
- [ ] No console errors
- [ ] Storage usage acceptable
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation reviewed
- [ ] Stakeholders notified

## 🎉 Success Indicators

✅ Artworks display on public page
✅ Admin can upload/edit/delete
✅ RLS policies working
✅ File storage organized correctly
✅ No performance issues
✅ No security vulnerabilities
✅ User feedback positive

## 📞 Support

For issues:
1. Check browser console
2. Check Supabase logs
3. Review error messages
4. Consult ARTWORK_SYSTEM_GUIDE.md
5. Check troubleshooting section

## 🔗 Related Documentation

- [ARTWORK_SYSTEM_GUIDE.md](./ARTWORK_SYSTEM_GUIDE.md) - Complete system guide
- [ARTWORK_IMPLEMENTATION_COMPLETE.md](./ARTWORK_IMPLEMENTATION_COMPLETE.md) - Implementation summary
- [migrate-artworks.mjs](./migrate-artworks.mjs) - Migration script

---

**Last Updated**: December 12, 2024
**Version**: 1.0.0
**Status**: Ready for deployment
