-- Fix RLS policies for categories table
-- Run this in your Supabase SQL Editor to resolve the "new row violates row-level security policy" error.

-- 1. Ensure RLS is enabled
alter table public.categories enable row level security;

-- 2. Re-create Insert Policy (Explicit check)
drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories" on public.categories
  for insert with check ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- 3. Re-create Update Policy
drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories" on public.categories
  for update using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- 4. Re-create Delete Policy
drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories" on public.categories
  for delete using ( 
    exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' )
  );

-- 5. Ensure Select Policy exists
drop policy if exists "Everyone can view categories" on public.categories;
create policy "Everyone can view categories" on public.categories
  for select using (true);
