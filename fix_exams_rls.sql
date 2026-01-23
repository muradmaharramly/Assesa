-- Fix RLS policies for exams table
-- This resolves the "Cannot coerce the result to a single JSON object" error during exam updates.
-- The issue is likely caused by the implicit is_admin() check failing during the UPDATE ... RETURNING clause.

-- 1. Re-create Update Policy with explicit check
drop policy if exists "Admins can update exams" on public.exams;
create policy "Admins can update exams" on public.exams
  for update using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- 2. Re-create Insert Policy with explicit check (for consistency)
drop policy if exists "Admins can insert exams" on public.exams;
create policy "Admins can insert exams" on public.exams
  for insert with check ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- 3. Re-create Delete Policy with explicit check (for consistency)
drop policy if exists "Admins can delete exams" on public.exams;
create policy "Admins can delete exams" on public.exams
  for delete using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );
