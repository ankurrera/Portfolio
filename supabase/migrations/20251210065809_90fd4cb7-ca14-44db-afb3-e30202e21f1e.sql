-- Allow users to check their own admin role (users can view their own role)
-- This is needed so the frontend can check if a user has admin access
DROP POLICY IF EXISTS "Users can check their own admin role" ON public.user_roles;
CREATE POLICY "Users can check their own admin role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create a function to auto-assign admin role to first user (bootstrap admin)
-- This allows the very first user who signs up to become an admin
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
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
    VALUES (NEW.id, 'admin');
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
  EXECUTE FUNCTION public.auto_assign_first_admin();