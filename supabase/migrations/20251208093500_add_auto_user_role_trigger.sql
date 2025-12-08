-- Auto-add users to user_roles table on signup
-- This migration creates a database trigger that automatically adds new users
-- to the user_roles table with a default 'user' role when they sign up through
-- Supabase Authentication. This eliminates the need for manual user role assignment.

-- Function to automatically add new users to user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into user_roles with 'user' role by default
  -- This happens automatically when a user signs up via Supabase Auth
  -- ON CONFLICT DO NOTHING prevents errors if the user already exists (e.g., race conditions)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
