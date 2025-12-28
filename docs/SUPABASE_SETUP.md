# Supabase Setup Guide

This guide will walk you through setting up your own Supabase instance for this photography portfolio template.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier is fine)
- Node.js 18+ installed
- Basic knowledge of SQL (for database setup)

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Choose a name for your project (e.g., "photography-portfolio")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
4. Click "Create new project" and wait for the project to be set up (this takes ~2 minutes)

### 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in the sidebar)
2. Navigate to **API** section
3. You'll need these values:
   - **Project URL**: Listed as "URL" (e.g., `https://xxxxx.supabase.co`)
   - **Project Reference ID**: The first part of your URL (e.g., `xxxxx`)
   - **anon public key**: Listed under "Project API keys" as "anon public"

### 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-project-reference-id"
   VITE_SUPABASE_URL="https://your-project-reference-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key-here"
   ```

3. **Important**: Never commit your `.env` file to git! It's already in `.gitignore`.

### 4. Set Up the Database

You need to run the SQL migrations to create the necessary tables and functions.

#### Option A: Using Supabase CLI (Recommended)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-reference-id
   ```
   
   When prompted, enter the database password you created in Step 1.

3. Push the migrations:
   ```bash
   supabase db push
   ```

#### Option B: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the sidebar)
3. Open each migration file in order and execute them:

   **First Migration**: `supabase/migrations/20251208080332_remix_migration_from_pg_dump.sql`
   - Click "New query"
   - Copy and paste the entire contents of the file
   - Click "Run"

   **Second Migration**: `supabase/migrations/20251208081442_25abee87-b56a-40c8-9af4-e7c2d206f677.sql`
   - Click "New query" again
   - Copy and paste the entire contents of this file
   - Click "Run"

   **Third Migration**: `supabase/migrations/20251208093500_add_auto_user_role_trigger.sql`
   - Click "New query" again
   - Copy and paste the entire contents of this file
   - Click "Run"
   - This migration creates a trigger to automatically add new users to the `user_roles` table

   **Fourth Migration**: `supabase/migrations/20251208095404_fix_user_roles_rls_policy.sql`
   - Click "New query" again
   - Copy and paste the entire contents of this file
   - Click "Run"
   - This migration fixes the RLS policy to allow users to view their own role

4. Verify the tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see: `photos` and `user_roles` tables

### 5. Configure Storage

The storage bucket for photos should be created automatically by the second migration. To verify:

1. Go to **Storage** in the Supabase dashboard sidebar
2. You should see a bucket named `photos`
3. This bucket is configured as public, allowing anyone to view photos

### 6. Configure Email Authentication (Important!)

By default, Supabase requires email confirmation for new signups. To allow users to sign in immediately after signup:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Under "Email Settings", find **"Confirm email"**
4. **Disable** the "Confirm email" toggle
5. Click "Save"

This allows users to sign up and log in immediately without needing to verify their email address.

**Note**: If you want to keep email confirmation enabled, you'll need to configure an email provider:
- Go to **Authentication** > **Email Templates** to customize confirmation emails
- Set up an SMTP provider in **Project Settings** > **Auth** > **SMTP Settings**

### 7. Create Your First Admin User

To access the admin dashboard, you need to create an admin user:

1. Start your application:
   ```bash
   npm install
   npm run dev
   ```

2. Navigate to the admin login page: `http://localhost:8080/admin/login`

3. Click "Don't have an account? Sign up" and create an account with your email and password
   - **Note**: You can now log in immediately after signup (no email verification required)
   - New users are automatically added to the `user_roles` table with the 'user' role

4. Grant admin access via SQL:
   - Go to your Supabase dashboard
   - Navigate to **SQL Editor**
   - Find your user ID in **Authentication** > **Users** (copy the **User UID**)
   - Run this query to upgrade your user to admin (replace `your-user-id` with your actual user ID):
   ```sql
   UPDATE public.user_roles
   SET role = 'admin'
   WHERE user_id = 'your-user-id-here';
   ```

5. Refresh your application and you should now have admin access!

### 8. Test Your Setup

1. Log in to the admin dashboard at `/admin/login`
2. Try uploading a photo to test the storage integration
3. Verify the photo appears in the appropriate category
4. Check that the photo is visible on the public-facing site

## Database Schema Overview

### Tables

**`photos`**
- Stores all photo metadata
- Fields: `id`, `category`, `title`, `description`, `image_url`, `display_order`, `created_at`, `updated_at`
- Categories: `selected`, `commissioned`, `editorial`, `personal`

**`user_roles`**
- Manages admin access control
- Fields: `id`, `user_id`, `role`, `created_at`
- Roles: `admin`, `user`

### Storage Buckets

**`photos`**
- Public bucket for photo storage
- Anyone can view
- Only admins can upload/update/delete

### Row Level Security (RLS)

All tables have RLS enabled:
- Public users can view all photos
- Only authenticated admin users can create/update/delete photos
- Users can view their own role in the `user_roles` table
- Admins can view all roles in the `user_roles` table

## Troubleshooting

### Issue: "You do not have admin access" even though role is set to admin
**Solution**: This is caused by a missing RLS policy. Make sure you've run all migrations, especially `20251208095404_fix_user_roles_rls_policy.sql`. If you've already set up your database before this migration existed:
1. Go to Supabase SQL Editor
2. Run this query:
   ```sql
   CREATE POLICY "Users can view their own role"
   ON public.user_roles
   FOR SELECT
   TO authenticated
   USING (user_id = auth.uid());
   ```
3. Sign out and sign back in

### Issue: "Failed to fetch" errors
**Solution**: Check that your environment variables are correct in `.env` and restart your dev server.

### Issue: "Insufficient permissions" when uploading photos
**Solution**: Verify your user has the admin role in the `user_roles` table.

### Issue: Photos not displaying
**Solution**: 
1. Check that the storage bucket is public
2. Verify the storage policies are correctly set
3. Check browser console for CORS errors

### Issue: Can't sign in after signup
**Solution**: 
1. Make sure email confirmation is disabled in Supabase (see Step 6 above)
2. Go to **Authentication** > **Providers** > **Email**
3. Disable the "Confirm email" toggle
4. If you want to use email confirmation, configure an SMTP provider first
5. Verify Supabase Auth is enabled in your project settings

### Issue: Not receiving confirmation emails
**Solution**: 
1. For immediate access without email verification, disable "Confirm email" in Supabase settings
2. If you need email confirmation:
   - Set up an SMTP provider in **Project Settings** > **Auth** > **SMTP Settings**
   - Configure custom email templates in **Authentication** > **Email Templates**
   - Or use a third-party email service like SendGrid or AWS SES

## Production Deployment

When deploying to production:

1. Set your environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Make sure to use your production Supabase credentials
3. Consider setting up custom email templates in Supabase Authentication settings
4. Review and adjust RLS policies if needed for your use case

## Security Best Practices

1. **Never commit** your `.env` file
2. Use different Supabase projects for development and production
3. Regularly rotate your API keys if they're exposed
4. Review your RLS policies to ensure they match your security requirements
5. Keep your Supabase project and dependencies up to date

## Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- Check the GitHub repository issues for this template
