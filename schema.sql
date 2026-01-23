-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores user data and roles. Linked to auth.users.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CATEGORIES TABLE (Moved up to be referenced by exams)
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. EXAMS TABLE
-- Stores exam definitions.
create table public.exams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  duration_minutes integer not null,
  is_active boolean default true,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  category_id uuid references public.categories(id) on delete set null,
  created_by uuid not null, -- Reference to auth.users (no FK constraint to allow admins without profiles)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. QUESTIONS TABLE
-- Stores questions for exams.
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- Stores options as a JSON array e.g. ["A", "B", "C", "D"] or objects
  correct_answer text not null, -- The correct answer string
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. EXAM ATTEMPTS TABLE
-- Tracks a user's attempt at an exam.
create table public.exam_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone,
  score integer, -- Calculated score
  total_questions integer,
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. EXAM ANSWERS TABLE
-- Stores individual answers for an attempt.
create table public.exam_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.exam_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_answer text not null,
  is_correct boolean, -- Can be populated upon submission or later
  time_spent_seconds integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.categories enable row level security;

-- POLICIES

-- HELPER FUNCTION
-- Checks if the current user is an admin.
-- defined as SECURITY DEFINER to bypass RLS recursion.
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- PROFILES POLICIES
-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using ( is_admin() );

-- Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Admins can update all profiles
create policy "Admins can update all profiles" on public.profiles
  for update using ( is_admin() );

-- CATEGORIES POLICIES
create policy "Everyone can view categories" on public.categories
  for select using (true);

create policy "Admins can insert categories" on public.categories
  for insert with check ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

create policy "Admins can update categories" on public.categories
  for update using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

create policy "Admins can delete categories" on public.categories
  for delete using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- EXAMS POLICIES
-- Authenticated users can view exams
create policy "Users can view exams" on public.exams
  for select using (auth.role() = 'authenticated');

-- Admins can insert exams
create policy "Admins can insert exams" on public.exams
  for insert with check ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- Admins can update exams
create policy "Admins can update exams" on public.exams
  for update using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- Admins can delete exams
create policy "Admins can delete exams" on public.exams
  for delete using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- QUESTIONS POLICIES
-- Authenticated users can view questions
create policy "Users can view questions" on public.questions
  for select using (auth.role() = 'authenticated');

-- Authenticated users can insert questions
create policy "Authenticated users can insert questions" on public.questions
  for insert with check (auth.role() = 'authenticated');

-- Users can update questions for their own exams
create policy "Users can update questions" on public.questions
  for update using (
    exists ( select 1 from public.exams where id = exam_id and created_by = auth.uid() )
  );

-- Users can delete questions for their own exams
create policy "Users can delete questions" on public.questions
  for delete using (
    exists ( select 1 from public.exams where id = exam_id and created_by = auth.uid() )
  );

-- EXAM ATTEMPTS POLICIES
-- Users can view their own attempts
create policy "Users can view own attempts" on public.exam_attempts
  for select using (auth.uid() = user_id);

-- Admins can view all attempts
create policy "Admins can view all attempts" on public.exam_attempts
  for select using ( is_admin() );

-- Users can insert their own attempts
create policy "Users can insert own attempts" on public.exam_attempts
  for insert with check (auth.uid() = user_id);

-- Users can update their own attempts (e.g. to mark as completed)
create policy "Users can update own attempts" on public.exam_attempts
  for update using (auth.uid() = user_id);

-- Users can delete their own attempts
create policy "Users can delete own attempts" on public.exam_attempts
  for delete using (auth.uid() = user_id);

-- Admins can update/delete attempts if needed
create policy "Admins can update all attempts" on public.exam_attempts
  for update using ( is_admin() );
  
create policy "Admins can delete all attempts" on public.exam_attempts
  for delete using ( is_admin() );

-- EXAM ANSWERS POLICIES
-- Users can view their own answers
create policy "Users can view own answers" on public.exam_answers
  for select using (
    exists (
      select 1 from public.exam_attempts
      where id = public.exam_answers.attempt_id and user_id = auth.uid()
    )
  );

-- Admins can view all answers
create policy "Admins can view all answers" on public.exam_answers
  for select using ( is_admin() );

-- Users can insert their own answers
create policy "Users can insert own answers" on public.exam_answers
  for insert with check (
    exists (
      select 1 from public.exam_attempts
      where id = attempt_id and user_id = auth.uid()
    )
  );

-- TRIGGER FOR NEW USER CREATION
-- Automatically inserts a row into public.profiles when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Insert some default categories
insert into public.categories (name, description) values
  ('General Knowledge', 'Exams covering general topics'),
  ('Mathematics', 'Math related exams'),
  ('Science', 'Science related exams'),
  ('Programming', 'Coding and programming exams');
