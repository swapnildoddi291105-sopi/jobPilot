-- =====================================================================
-- JobPilot — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Project: https://ahfxbqpiqgihciukhjfk.supabase.co
-- =====================================================================
-- Creates 6 tables + Row Level Security (RLS) policies so each user
-- can only read/write their own data.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- =====================================================================

-- Enable the UUID generator (Supabase has this by default, but be safe)
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. PROFILES  (one row per user, linked to auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text,
  location    text,
  bio         text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 2. JOBS  (job applications)
-- =====================================================================
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  company      text not null,
  location     text,
  source       text default 'Manual',
  salary       text,
  url          text,
  description  text,
  status       text not null default 'Saved'
                check (status in ('Saved','Applied','Phone Screen','Interviewing','Offer','Rejected','Optimized')),
  notes        text,
  date_applied timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_status  on public.jobs(status);
create index if not exists idx_jobs_date    on public.jobs(date_applied desc);

-- =====================================================================
-- 3. RESUMES  (uploaded resumes + parsed data + Drive link)
-- =====================================================================
create table if not exists public.resumes (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  name                   text not null,
  file_name              text not null,
  file_size              bigint,
  mime_type              text,
  drive_file_id          text,
  drive_web_view_link    text,
  extracted_text         text,
  ats_score              integer,
  target_role            text,
  parsed_skills          jsonb default '[]'::jsonb,
  parsed_email           text,
  parsed_phone           text,
  parsed_experience_years numeric,
  parsed_summary         text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists idx_resumes_user_id on public.resumes(user_id);

-- =====================================================================
-- 4. USER_SETTINGS  (job prefs + automation toggles)
-- =====================================================================
create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  target_roles           jsonb default '[]'::jsonb,
  target_locations       jsonb default '[]'::jsonb,
  salary_min             integer,
  salary_max             integer,
  job_types              jsonb default '["Full-time"]'::jsonb,
  sources                jsonb default '["LinkedIn","Indeed"]'::jsonb,
  auto_apply             boolean default false,
  follow_up_reminders    boolean default true,
  email_notifications    boolean default true,
  browser_notifications  boolean default false,
  weekly_digest          boolean default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- =====================================================================
-- 5. JOB_ACTIVITIES  (timeline events per application)
-- =====================================================================
create table if not exists public.job_activities (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event       text not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activities_job_id  on public.job_activities(job_id);
create index if not exists idx_activities_user_id on public.job_activities(user_id);

-- =====================================================================
-- 6. NOTIFICATIONS  (in-app notifications)
-- =====================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  message     text,
  read        boolean default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- =====================================================================
-- 7. OPTIMIZED RESUMES  (Gemini-optimized resumes per job)
-- =====================================================================
create table if not exists public.optimized_resumes (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  resume_pdf_url    text,
  ats_score         integer,
  missing_keywords  jsonb default '[]'::jsonb,
  optimized_data    jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists idx_optimized_resumes_user_id on public.optimized_resumes(user_id);
create index if not exists idx_optimized_resumes_job_id  on public.optimized_resumes(job_id);

-- =====================================================================
-- 8. WORKFLOW_LOGS  (audit trail for workflow automation)
-- =====================================================================
create table if not exists public.workflow_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  status     text not null,
  message    text,
  meta       jsonb,
  timestamp  timestamptz not null default now()
);
create index if not exists idx_workflow_logs_user_id on public.workflow_logs(user_id);

-- =====================================================================
-- AUTO-CREATE PROFILE + SETTINGS ON SIGNUP
-- (trigger fires when a new auth.users row is inserted)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- updated_at auto-maintenance
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists resumes_touch on public.resumes;
create trigger resumes_touch before update on public.resumes
  for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists optimized_resumes_touch on public.optimized_resumes;
create trigger optimized_resumes_touch before update on public.optimized_resumes
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY  — users can only access their own rows
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.jobs               enable row level security;
alter table public.resumes            enable row level security;
alter table public.user_settings      enable row level security;
alter table public.job_activities     enable row level security;
alter table public.notifications      enable row level security;
alter table public.optimized_resumes  enable row level security;
alter table public.workflow_logs      enable row level security;

-- profiles: a user can read/update only their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- jobs
drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = user_id);
drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = user_id);
drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs
  for update using (auth.uid() = user_id);
drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs
  for delete using (auth.uid() = user_id);

-- resumes
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);
drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);
drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id);
drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- user_settings
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
drop policy if exists "settings_upsert_own" on public.user_settings;
create policy "settings_upsert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id);

-- job_activities
drop policy if exists "activities_select_own" on public.job_activities;
create policy "activities_select_own" on public.job_activities
  for select using (auth.uid() = user_id);
drop policy if exists "activities_all_own" on public.job_activities;
create policy "activities_all_own" on public.job_activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
drop policy if exists "notifications_all_own" on public.notifications;
create policy "notifications_all_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- optimized_resumes
drop policy if exists "optimized_resumes_select_own" on public.optimized_resumes;
create policy "optimized_resumes_select_own" on public.optimized_resumes
  for select using (auth.uid() = user_id);
drop policy if exists "optimized_resumes_insert_own" on public.optimized_resumes;
create policy "optimized_resumes_insert_own" on public.optimized_resumes
  for insert with check (auth.uid() = user_id);
drop policy if exists "optimized_resumes_delete_own" on public.optimized_resumes;
create policy "optimized_resumes_delete_own" on public.optimized_resumes
  for delete using (auth.uid() = user_id);

-- workflow_logs
drop policy if exists "workflow_logs_select_own" on public.workflow_logs;
create policy "workflow_logs_select_own" on public.workflow_logs
  for select using (auth.uid() = user_id);
drop policy if exists "workflow_logs_insert_all" on public.workflow_logs;
create policy "workflow_logs_insert_all" on public.workflow_logs
  for insert with check (true);

-- =====================================================================
-- 9. APPLICATIONS  (application tracking for n8n workflow)
-- =====================================================================
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  job_id          uuid not null references public.jobs(id) on delete cascade,
  status          text not null default 'Applied'
                    check (status in ('Applied','Phone Screen','Interviewing','Offer','Rejected','Withdrawn','Archived')),
  applied_at      timestamptz not null default now(),
  interview_at    timestamptz,
  follow_up_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, job_id)
);
create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_job_id  on public.applications(job_id);
create index if not exists idx_applications_status  on public.applications(status);

-- =====================================================================
-- 10. COVER LETTERS  (AI-generated cover letters)
-- =====================================================================
create table if not exists public.cover_letters (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  job_id          uuid not null references public.jobs(id) on delete cascade,
  resume_id       uuid references public.resumes(id) on delete set null,
  content         text not null,
  tone            text default 'professional',
  created_at      timestamptz not null default now()
);
create index if not exists idx_cover_letters_user_id on public.cover_letters(user_id);
create index if not exists idx_cover_letters_job_id  on public.cover_letters(job_id);

-- =====================================================================
-- RLS FOR NEW TABLES
-- =====================================================================
alter table public.applications  enable row level security;
alter table public.cover_letters enable row level security;

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (auth.uid() = user_id);
drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);
drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update using (auth.uid() = user_id);
drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

drop policy if exists "cover_letters_select_own" on public.cover_letters;
create policy "cover_letters_select_own" on public.cover_letters
  for select using (auth.uid() = user_id);
drop policy if exists "cover_letters_insert_own" on public.cover_letters;
create policy "cover_letters_insert_own" on public.cover_letters
  for insert with check (auth.uid() = user_id);
drop policy if exists "cover_letters_delete_own" on public.cover_letters;
create policy "cover_letters_delete_own" on public.cover_letters
  for delete using (auth.uid() = user_id);

-- =====================================================================
-- TRIGGER: auto-update updated_at on applications
-- =====================================================================
drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- DONE. Verify with:
--   select table_name from information_schema.tables
--   where table_schema = 'public' order by table_name;
-- Expected: profiles, jobs, resumes, user_settings, job_activities, notifications,
--           optimized_resumes, workflow_logs, applications, cover_letters
-- =====================================================================
