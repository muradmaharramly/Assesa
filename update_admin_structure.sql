-- Migration to update admin structure
-- This script aligns the database with the requirement:
-- "Admins only in Supabase Auth, Users only in Profiles table"

-- 1. Remove Foreign Key constraint from exams.created_by
-- This allows admins (who won't have a profile) to be referenced as creators.
ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_created_by_fkey;

-- 2. Update is_admin function to check Auth Metadata (JWT) instead of Profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check user_metadata or app_metadata for 'admin' role
  RETURN (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' 
    OR 
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Trigger to ONLY create profiles for 'user' role
-- Admins created in Auth will NOT get a profile entry.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if role is NOT admin
  IF (new.raw_user_meta_data->>'role') IS DISTINCT FROM 'admin' THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', 'New User'), 
      'user'
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Cleanup (Optional but Recommended)
-- Remove existing admin profiles to strictly enforce "Users only in Profiles".
-- WARNING: Ensure your Admin User has 'role': 'admin' in their Auth Metadata (raw_user_meta_data)
-- BEFORE running this, otherwise you might lose admin access logic in some parts of the app (though is_admin checks metadata).
--
-- Uncomment the line below to execute the cleanup:
-- DELETE FROM public.profiles WHERE role = 'admin';
