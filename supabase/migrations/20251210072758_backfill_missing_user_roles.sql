-- Backfill user_roles for existing users who don't have any role
-- This is needed because the previous buggy trigger (auto_assign_first_admin)
-- did not create user_roles entries for users created after the first user.
--
-- This migration should be run AFTER 20251210072757_fix_user_roles_trigger_for_all_users.sql
-- to ensure that future users get roles automatically, and this migration fixes
-- any existing users who were created without roles.

-- Insert 'user' role for all auth.users who don't have any entry in user_roles
-- This ensures that users who were created when the buggy trigger was active
-- will now have a role and can login properly.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Note: If you want to manually promote a user to admin, you can either:
-- 1. Update their existing role:
--    UPDATE public.user_roles SET role = 'admin' WHERE user_id = '<user_id>';
-- 
-- 2. Or insert an additional admin role (if your app supports multiple roles per user):
--    INSERT INTO public.user_roles (user_id, role) VALUES ('<user_id>', 'admin')
--    ON CONFLICT (user_id, role) DO NOTHING;
