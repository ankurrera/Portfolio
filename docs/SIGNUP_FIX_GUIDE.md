# Signup Issue Fix - Implementation Guide

## Problem
Signups were not getting saved to Supabase authentication and user_roles tables.

## Root Causes Identified

1. **Database trigger might not be installed**: The trigger that automatically adds users to the `user_roles` table might not exist in the database if migrations were not run properly.

2. **Email confirmation enabled**: By default, Supabase requires email confirmation. If enabled without proper SMTP configuration:
   - Users ARE created in `auth.users` table
   - BUT they cannot sign in until email is confirmed
   - This makes it APPEAR like signup didn't work

3. **Missing permissions**: The trigger function might lack proper permissions to insert into `user_roles` table.

## Fixes Applied

### 1. New Migration File
Created: `supabase/migrations/20251209082000_ensure_user_roles_trigger_and_policies.sql`

This migration:
- Recreates the `handle_new_user()` trigger function
- Drops and recreates the trigger to ensure it's properly configured
- Verifies the "Users can view their own role" policy exists
- Grants necessary permissions for the trigger to execute

### 2. Updated signUp Function
File: `src/hooks/useAuth.tsx`

Changes:
- Added `emailRedirectTo` option for better email confirmation handling
- Added detailed logging to track signup success
- Added warning when user is created but email confirmation is required
- Improved error handling and debugging output

### 3. Better Error Messages
File: `src/pages/AdminLogin.tsx`

Changes:
- Detects email confirmation errors
- Provides specific error messages for common issues
- Helps users understand if email confirmation is required

## Setup Instructions

### Step 1: Run the New Migration

You MUST run the new migration to ensure the trigger is properly configured.

**Option A: Using Supabase CLI (Recommended)**
```bash
supabase db push
```

**Option B: Manual SQL Execution**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/20251209082000_ensure_user_roles_trigger_and_policies.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click "Run"

### Step 2: Disable Email Confirmation (Recommended for Development)

For immediate signup/login access without email verification:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Click on **Email**
5. Find "Confirm email" toggle and **turn it OFF**
6. Click **Save**

**Note**: See EMAIL_SETUP_GUIDE.md for detailed instructions and production considerations.

### Step 3: Verify the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `/admin/login`

3. Click "Don't have an account? Sign up"

4. Create a test account with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`

5. Check the browser console for signup logs:
   - Should see "SignUp successful:" with user details
   - `emailConfirmed` should be `true` (if confirmation disabled)
   - `session` should be `true` (if confirmation disabled)

6. Verify in Supabase Dashboard:
   - Go to **Authentication** > **Users**
   - Your test user should appear in the list
   - Go to **Table Editor** > **user_roles**
   - Your user should have a row with `role = 'user'`

### Step 4: Test Sign In

1. After signup, try signing in with the same credentials
2. You should be able to sign in immediately (if email confirmation is disabled)
3. Check that you can access the application

## Verifying the Trigger Exists

To verify the trigger is properly installed:

1. Go to Supabase Dashboard > SQL Editor
2. Run this query:

```sql
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname = 'on_auth_user_created';
```

You should see:
- `trigger_name`: `on_auth_user_created`
- `enabled`: `O` (meaning enabled)
- `function_name`: `handle_new_user`

## Verifying User Roles Policy

To verify the RLS policy exists:

1. Go to Supabase Dashboard > SQL Editor
2. Run this query:

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'user_roles';
```

You should see at least:
- "Admins can view all roles" (SELECT)
- "Users can view their own role" (SELECT)

## Troubleshooting

### Issue: "SignUp successful" but user not in auth.users
**Unlikely**: Supabase always creates the user. Check:
1. Look in Authentication > Users in Supabase Dashboard
2. User might be there but unconfirmed

### Issue: User created but not in user_roles table
**Cause**: Trigger not installed or not working

**Solution**:
1. Run the new migration (Step 1 above)
2. Verify trigger exists (see "Verifying the Trigger Exists")
3. Try creating a new test user
4. Check the trigger function logs in Supabase Dashboard > Logs

### Issue: "User created but email confirmation is required" in console
**Cause**: Email confirmation is enabled but not configured

**Solution**: Disable email confirmation (Step 2 above) OR configure SMTP (see EMAIL_SETUP_GUIDE.md)

### Issue: Can't sign in after signup
**Cause**: Email confirmation is enabled

**Solutions**:
1. Disable email confirmation in Supabase settings
2. OR check your email for confirmation link
3. OR configure SMTP provider (see EMAIL_SETUP_GUIDE.md)

### Issue: "Error checking admin role" in console
**Cause**: User_roles entry exists but RLS policy prevents reading

**Solution**: Run all migrations including `20251208095404_fix_user_roles_rls_policy.sql`

## Testing Checklist

- [ ] New migration executed successfully
- [ ] Email confirmation disabled in Supabase (if desired)
- [ ] Can create new user account
- [ ] User appears in auth.users table
- [ ] User appears in user_roles table with 'user' role
- [ ] Can sign in with new account immediately
- [ ] No errors in browser console
- [ ] No errors in Supabase logs

## For Production

1. **Email Confirmation**: Consider enabling it with proper SMTP configuration for security
2. **Monitoring**: Set up logging to track signup failures
3. **Testing**: Test signup flow in production environment before launch
4. **Backup**: Ensure database backups are configured

## Additional Resources

- EMAIL_SETUP_GUIDE.md - Email confirmation configuration
- SUPABASE_SETUP.md - Complete Supabase setup guide
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Triggers Documentation](https://supabase.com/docs/guides/database/postgres/triggers)
