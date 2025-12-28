# Quick Start Guide

## For New Users

If this is your first time setting up this project:

1. **Read the migration summary**:
   ```bash
   cat MIGRATION_SUMMARY.md
   ```

2. **Follow the Supabase setup guide**:
   ```bash
   cat SUPABASE_SETUP.md
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start developing**:
   ```bash
   npm run dev
   ```

## For Existing Users

If you already had this project set up with Supabase:

1. **Update dependencies** (lovable-tagger was removed):
   ```bash
   npm install
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

That's it! Everything else remains the same.

## Your Environment Setup

Your `.env` file should already be configured with:
- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

If not, copy `.env.example` to `.env` and fill in your values.

## Common Commands

- `npm run dev` - Start development server (http://localhost:8080)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

## Admin Access

To access the admin dashboard:
1. Go to http://localhost:8080/admin/login
2. Sign up with an email/password
3. Grant yourself admin access via SQL (see SUPABASE_SETUP.md)

## Need Help?

- Check `SUPABASE_SETUP.md` for detailed setup instructions
- Check `MIGRATION_SUMMARY.md` for what changed
- Check `README.md` for general project information
