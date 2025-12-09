-- Ensure user_roles trigger and policies are properly configured
-- This migration ensures that user signups are properly saved to both auth.users and user_roles tables

-- Recreate the function to ensure it exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into user_roles with 'user' role by default
  -- This happens automatically when a user signs up via Supabase Auth
  -- ON CONFLICT DO NOTHING prevents errors if the user already exists
  -- Note: The table has UNIQUE (user_id, role) constraint, allowing multiple roles per user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the trigger if it exists and recreate it to ensure it's properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify that users can view their own role (this policy should already exist from previous migration)
-- We use DO block to avoid errors if the policy already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view their own role'
  ) THEN
    CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Grant necessary permissions to ensure the trigger can execute
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO postgres, service_role;
