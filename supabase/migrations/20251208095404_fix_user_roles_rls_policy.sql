-- Fix RLS policy on user_roles table to allow users to view their own role
-- This fixes the issue where users cannot check their own admin status
-- due to the overly restrictive "Admins can view all roles" policy

-- Add policy to allow users to view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
