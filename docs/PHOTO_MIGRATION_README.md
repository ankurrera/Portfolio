# Photo Migration Script

This script migrates local photos from `src/assets/gallery` to Supabase storage bucket.

## Prerequisites

1. Ensure you have a `.env` file with valid Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   **Important:** This script requires a **service role key** (not the publishable key) to bypass Row Level Security policies and upload files to storage.
   
   - The service role key can be found in your Supabase project settings under "API"
   - Never commit this key to version control
   - The script will fall back to `VITE_SUPABASE_PUBLISHABLE_KEY` but uploads may fail due to RLS policies

2. Ensure the `photos` storage bucket exists in your Supabase project with proper policies

3. Install dependencies if not already done:
   ```bash
   npm install
   ```

## Usage

Run the migration script:

```bash
node migrate-photos-to-supabase.mjs
```

## What it does

1. Scans `src/assets/gallery` for image files (jpg, jpeg, png, webp)
2. Determines the category for each photo based on filename patterns
3. Uploads each photo to Supabase storage in the `photos` bucket
4. Creates database entries in the `photos` table with:
   - Proper display order and z-index
   - Auto-calculated grid positions (3-column layout)
   - Photo metadata (title, dimensions, etc.)

## Category Mapping

The script automatically assigns categories based on filename prefixes:
- `selected-*` → selected
- `commissioned-*` or `marie-*` → commissioned
- `editorial-*` → editorial
- Other nature/landscape photos → personal

## Notes

- Photos are uploaded with cache control for optimal performance
- The script skips files that already exist in storage
- Each photo gets a unique timestamp prefix to avoid conflicts
- Failed uploads are logged and counted in the summary
