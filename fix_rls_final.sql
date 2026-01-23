-- FIX RLS POLICIES (FINAL)
-- This script removes the strict "Admin Only" restriction for creating exams.
-- It allows ANY logged-in user to create, update, and delete their OWN exams.

-- 1. EXAMS TABLE POLICIES
drop policy if exists "Admins can insert exams" on public.exams;
drop policy if exists "Admins can update exams" on public.exams;
drop policy if exists "Admins can delete exams" on public.exams;

-- Allow any authenticated user to create an exam
create policy "Authenticated users can insert exams" on public.exams
  for insert with check (auth.role() = 'authenticated');

-- Allow users to update/delete ONLY exams they created
create policy "Users can update own exams" on public.exams
  for update using (auth.uid() = created_by);

create policy "Users can delete own exams" on public.exams
  for delete using (auth.uid() = created_by);


-- 2. QUESTIONS TABLE POLICIES (Just in case)
drop policy if exists "Admins can insert questions" on public.questions;
drop policy if exists "Admins can update questions" on public.questions;
drop policy if exists "Admins can delete questions" on public.questions;

-- Allow any authenticated user to insert questions (assuming they are creating an exam)
create policy "Authenticated users can insert questions" on public.questions
  for insert with check (auth.role() = 'authenticated');

-- Allow users to update/delete questions for exams they own
-- Note: This requires a join or a subquery, but for simplicity in MVP we can check exam ownership or just allow authenticated for now if RLS complexity is high.
-- A simpler approach for questions:
create policy "Users can update questions" on public.questions
  for update using (
    exists ( select 1 from public.exams where id = exam_id and created_by = auth.uid() )
  );

create policy "Users can delete questions" on public.questions
  for delete using (
    exists ( select 1 from public.exams where id = exam_id and created_by = auth.uid() )
  );
