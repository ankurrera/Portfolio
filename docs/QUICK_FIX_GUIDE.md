# Quick Fix Guide - Photos Table Schema Errors

If you're seeing errors like:
- `column photos.z_index does not exist`
- `Could not find the 'height' column in schema cache`
- `Could not find the 'width' column`

## Quick Fix (5 minutes)

### Step 1: Apply the Migration

**Option A - Using Supabase CLI (Recommended)**
```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-id

# Apply the migration
supabase db push
```

**Option B - Manual in Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the sidebar
3. Click "New query"
4. Copy and paste the entire contents of this file: `supabase/migrations/20251209100000_fix_photos_table_schema.sql`
5. Click "Run"
6. Wait for "Success" message

### Step 2: Refresh Schema Cache

In the same SQL Editor, run this command:
```sql
NOTIFY pgrst, 'reload schema';
```

**OR** restart your project:
- Go to Project Settings → General
- Click "Restart project"
- Wait 1-2 minutes

### Step 3: Clear Your Browser Cache

In your browser:
- **Windows/Linux**: Press `Ctrl + Shift + R`
- **Mac**: Press `Cmd + Shift + R`

Or clear browser cache completely.

### Step 4: Test

1. Reload your application
2. Go to admin dashboard
3. Try uploading a photo
4. Try dragging/resizing a photo
5. Save and publish

✅ **Done!** The errors should be gone.

## What This Does

The migration:
- ✅ Drops conflicting columns
- ✅ Recreates them with correct types
- ✅ Adds performance indexes
- ✅ Ensures schema cache is fresh

⚠️ **Note**: Existing photo layout positions will reset to defaults. Photos themselves are not affected.

## Still Having Issues?

1. **Check migration applied successfully**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'photos' AND column_name IN ('z_index', 'width', 'height');
   ```
   You should see 3 rows with the correct types.

2. **Check for error details**
   - Look at Supabase Dashboard → Logs
   - Check browser console (F12)
   - Note the exact error message and code

3. **Read full documentation**
   - `MIGRATION_GUIDE.md` - Detailed instructions
   - `PHOTOS_TABLE_SCHEMA.md` - Complete schema reference
   - `SCHEMA_FIX_SUMMARY.md` - Technical details

## Need Help?

If the quick fix doesn't work:
1. Check you have admin access to the Supabase project
2. Ensure you're using the correct project ID
3. Try the manual SQL approach if CLI fails
4. Review the full migration guide for troubleshooting

The migration is safe to run multiple times if needed.
