-- FIX PERMISSIONS SCRIPT
-- Run this entire script in your Supabase SQL Editor to fix the "Row-level security" errors.

-- 1. Ensure a profile exists for EVERY user in the system (syncs auth.users -> public.profiles)
--    This fixes cases where the profile creation trigger didn't fire.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'User'), 
  'admin' -- Default to admin for any restored users
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'admin'; -- Make sure existing users become admins too

-- 2. Explicitly set ALL existing profiles to 'admin' role
--    This ensures that whoever you are logged in as, you will have admin privileges.
UPDATE public.profiles
SET role = 'admin';

-- 3. Verify the result
SELECT email, role FROM public.profiles;
