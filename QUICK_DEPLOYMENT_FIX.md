# Quick Deployment Guide - Vercel Login Fix

## The Problem
Users can't login on Vercel even when their role is set to 'admin'.

## The Cause
The database trigger was only creating roles for the first user, leaving everyone else without a role.

## The Fix (3 Simple Steps)

### Step 1: Go to Supabase Dashboard
Navigate to: **SQL Editor** in your Supabase project

### Step 2: Run the Fix SQL
Copy and paste this entire block, then click "Run":

```sql
-- Fix the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_with_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_first_admin();

-- Fix existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 3: Promote Your Admin User (Optional)
If you need to make a specific user an admin, run:

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);
```

Replace `your-email@example.com` with your actual email.

## Done! ✅

- Users can now login
- First user automatically gets admin
- Other users get user role
- You can promote anyone to admin using Step 3

## Verify It Worked

Check all users and their roles:
```sql
SELECT 
  u.email, 
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;
```

Everyone should have a role now!

## More Details
See [VERCEL_LOGIN_FIX.md](./VERCEL_LOGIN_FIX.md) for complete documentation.
