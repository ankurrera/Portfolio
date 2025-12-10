-- Fix user_roles trigger to assign roles to ALL users, not just the first one
-- This fixes the issue where users created after the first user get no role at all
-- and therefore cannot login even when manually set to admin in the database

-- Create an improved function that:
-- 1. Gives the FIRST user 'admin' role (bootstrap admin)
-- 2. Gives ALL subsequent users 'user' role (not nothing!)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user by checking if user_roles is empty
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    -- First user gets admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- All subsequent users get 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run when new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_first_admin();

-- Note: This migration fixes the trigger for FUTURE users.
-- Existing users who were created without roles are fixed by the companion migration:
-- 20251210072758_backfill_missing_user_roles.sql
-- 
-- If you're running migrations individually, make sure to run both migrations.
