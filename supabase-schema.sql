-- ============================================
-- JobPilot Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- RESUMES TABLE
-- ============================================
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_name text,
  file_size bigint,
  mime_type text,
  drive_file_id text,
  drive_web_view_link text,
  extracted_text text,
  ats_score int,
  target_role text,
  parsed_skills jsonb default '[]'::jsonb,
  parsed_email text,
  parsed_phone text,
  parsed_experience_years text,
  parsed_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster queries
create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- Enable RLS
alter table public.resumes enable row level security;

create policy "Users can view own resumes" on public.resumes
  for select using (auth.uid() = user_id);

create policy "Users can insert own resumes" on public.resumes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own resumes" on public.resumes
  for update using (auth.uid() = user_id);

create policy "Users can delete own resumes" on public.resumes
  for delete using (auth.uid() = user_id);

-- ============================================
-- JOBS TABLE
-- ============================================
create table if not exists public.jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  company text not null,
  location text default 'Unknown',
  source text default 'Manual',
  salary text,
  url text,
  description text,
  status text default 'Saved',
  notes text,
  date_applied timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_date_applied_idx on public.jobs(date_applied desc);

-- Enable RLS
alter table public.jobs enable row level security;

create policy "Users can view own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own jobs" on public.jobs
  for update using (auth.uid() = user_id);

create policy "Users can delete own jobs" on public.jobs
  for delete using (auth.uid() = user_id);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_roles text[] default '{}',
  target_locations text[] default '{}',
  salary_min int,
  salary_max int,
  job_types text[] default '{"Full-time"}',
  sources text[] default '{"LinkedIn", "Indeed"}',
  auto_apply boolean default false,
  email text,
  follow_up_reminders boolean default true,
  email_notifications boolean default true,
  browser_notifications boolean default false,
  weekly_digest boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_settings enable row level security;

create policy "Users can view own settings" on public.user_settings
  for select using (auth.uid() = user_id);

create policy "Users can upsert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

-- ============================================
-- OPTIMIZED RESUMES TABLE (for Task C)
-- ============================================
create table if not exists public.optimized_resumes (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  resume_pdf_url text,
  ats_score int,
  missing_keywords text[] default '{}',
  optimized_data jsonb,
  created_at timestamptz default now()
);

create index if not exists optimized_resumes_user_id_idx on public.optimized_resumes(user_id);
create index if not exists optimized_resumes_job_id_idx on public.optimized_resumes(job_id);

-- Enable RLS
alter table public.optimized_resumes enable row level security;

create policy "Users can view own optimized resumes" on public.optimized_resumes
  for select using (auth.uid() = user_id);

create policy "Users can insert own optimized resumes" on public.optimized_resumes
  for insert with check (auth.uid() = user_id);

-- ============================================
-- WORKFLOW LOGS TABLE (for Task E - n8n)
-- ============================================
create table if not exists public.workflow_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null, -- 'started', 'completed', 'failed'
  message text,
  meta jsonb,
  timestamp timestamptz default now()
);

create index if not exists workflow_logs_user_id_idx on public.workflow_logs(user_id);
create index if not exists workflow_logs_timestamp_idx on public.workflow_logs(timestamp desc);

-- Enable RLS
alter table public.workflow_logs enable row level security;

create policy "Users can view own workflow logs" on public.workflow_logs
  for select using (auth.uid() = user_id);

create policy "Service role can insert workflow logs" on public.workflow_logs
  for insert with check (true); -- Allow service role for n8n

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Apply updated_at trigger to tables
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_resumes_updated_at on public.resumes;
create trigger update_resumes_updated_at
  before update on public.resumes
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_jobs_updated_at on public.jobs;
create trigger update_jobs_updated_at
  before update on public.jobs
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_user_settings_updated_at on public.user_settings;
create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row execute procedure public.update_updated_at_column();