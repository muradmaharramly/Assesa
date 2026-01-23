-- Fix infinite recursion in RLS policies by introducing a Security Definer function

-- 1. Create a security definer function to check admin status
-- This function runs with the privileges of the creator (postgres) and bypasses RLS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the problematic recursive policies on PROFILES
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- 3. Re-create PROFILES policies using is_admin()
create policy "Admins can view all profiles" on public.profiles
  for select using (
    is_admin()
  );

create policy "Admins can update all profiles" on public.profiles
  for update using (
    is_admin()
  );

-- 4. Optimize other admin policies to use is_admin() (Recommended)

-- EXAMS
drop policy if exists "Admins can insert exams" on public.exams;
create policy "Admins can insert exams" on public.exams
  for insert with check ( is_admin() );

drop policy if exists "Admins can update exams" on public.exams;
create policy "Admins can update exams" on public.exams
  for update using ( is_admin() );

drop policy if exists "Admins can delete exams" on public.exams;
create policy "Admins can delete exams" on public.exams
  for delete using ( is_admin() );

-- QUESTIONS
drop policy if exists "Admins can insert questions" on public.questions;
create policy "Admins can insert questions" on public.questions
  for insert with check ( is_admin() );

drop policy if exists "Admins can update questions" on public.questions;
create policy "Admins can update questions" on public.questions
  for update using ( is_admin() );

drop policy if exists "Admins can delete questions" on public.questions;
create policy "Admins can delete questions" on public.questions
  for delete using ( is_admin() );

-- EXAM ATTEMPTS
drop policy if exists "Admins can view all attempts" on public.exam_attempts;
create policy "Admins can view all attempts" on public.exam_attempts
  for select using ( is_admin() );

drop policy if exists "Admins can update all attempts" on public.exam_attempts;
create policy "Admins can update all attempts" on public.exam_attempts
  for update using ( is_admin() );

drop policy if exists "Admins can delete all attempts" on public.exam_attempts;
create policy "Admins can delete all attempts" on public.exam_attempts
  for delete using ( is_admin() );

-- EXAM ANSWERS
drop policy if exists "Admins can view all answers" on public.exam_answers;
create policy "Admins can view all answers" on public.exam_answers
  for select using ( is_admin() );
