# Admin Access Fix - Migration Guide

## Problem
Users were experiencing an issue where they would sign in successfully but receive the message "You do not have admin access" even though their role was set to 'admin' in the Supabase `user_roles` table.

## Root Cause
The issue was caused by an overly restrictive Row Level Security (RLS) policy on the `user_roles` table. The original policy only allowed admin users to view roles:

```sql
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

This created a chicken-and-egg problem:
1. User signs in with credentials
2. Application tries to check if user is admin by querying `user_roles` table
3. RLS policy blocks the query because it requires the user to already be admin
4. Query returns no results
5. User is denied admin access

## Solution
A new migration (`20251208095404_fix_user_roles_rls_policy.sql`) adds a policy that allows authenticated users to view their own role:

```sql
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

This allows:
- Users to check their own role (fixing the admin access issue)
- Admins to still view all roles (via the existing policy)

## How to Apply the Fix

### If you haven't set up the database yet
Simply run all migrations in order using either:
- `supabase db push` (if using Supabase CLI), or
- Execute each migration file in the SQL Editor in order

### If you already have a database set up
You have two options:

#### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

#### Option 2: Manual SQL Execution
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click "New query"
4. Copy and paste the contents of `supabase/migrations/20251208095404_fix_user_roles_rls_policy.sql`
5. Click "Run"

### After applying the fix
1. Sign out of your application
2. Sign back in
3. You should now have admin access (if your role is set to 'admin' in the database)

## Verifying the Fix
To verify the fix was applied correctly:

1. Go to Supabase SQL Editor
2. Run this query:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'user_roles';
   ```
3. You should see two policies:
   - "Admins can view all roles"
   - "Users can view their own role"

## Impact
This fix:
- ✅ Allows users to check their own role
- ✅ Maintains security by only showing users their own role
- ✅ Preserves admin ability to view all roles
- ✅ Does not affect any other functionality

## Future Considerations
This fix is backward compatible and does not require any code changes. All existing users will automatically benefit from this fix once the migration is applied.
