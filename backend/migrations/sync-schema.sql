-- ============================================================================
-- Migration: Sync Supabase schema with backend code requirements
-- 
-- This migration:
--   ✅ Creates missing tables (profiles, user_settings)
--   ✅ Adds missing columns to existing tables
--   ✅ Adds foreign key constraints
--   ✅ Adds indexes
--   ✅ Enables RLS + creates policies
--   ❌ NEVER drops existing columns or tables
--   ❌ NEVER destroys data
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE (does not exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  role        TEXT,
  location    TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. USER_SETTINGS TABLE (does not exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_roles         JSONB DEFAULT '[]'::jsonb,
  target_locations     JSONB DEFAULT '[]'::jsonb,
  salary_min           INTEGER,
  salary_max           INTEGER,
  job_types            JSONB DEFAULT '["Full-time"]'::jsonb,
  sources              JSONB DEFAULT '["LinkedIn", "Indeed"]'::jsonb,
  auto_apply           BOOLEAN DEFAULT false,
  follow_up_reminders  BOOLEAN DEFAULT true,
  email_notifications  BOOLEAN DEFAULT true,
  browser_notifications BOOLEAN DEFAULT false,
  weekly_digest        BOOLEAN DEFAULT true,
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. RESUMES — missing columns
-- ============================================================================
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS name                    TEXT,
  ADD COLUMN IF NOT EXISTS file_name               TEXT,
  ADD COLUMN IF NOT EXISTS file_size               BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type               TEXT,
  ADD COLUMN IF NOT EXISTS drive_web_view_link     TEXT,
  ADD COLUMN IF NOT EXISTS extracted_text          TEXT,
  ADD COLUMN IF NOT EXISTS ats_score               INTEGER,
  ADD COLUMN IF NOT EXISTS target_role             TEXT,
  ADD COLUMN IF NOT EXISTS parsed_skills           JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parsed_email            TEXT,
  ADD COLUMN IF NOT EXISTS parsed_phone            TEXT,
  ADD COLUMN IF NOT EXISTS parsed_experience_years INTEGER,
  ADD COLUMN IF NOT EXISTS parsed_summary          TEXT;

-- Ensure resumes.user_id references auth.users
ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;  -- NOT VALID skips expensive check on existing rows
ALTER TABLE public.resumes VALIDATE CONSTRAINT resumes_user_id_fkey;

-- ============================================================================
-- 4. JOBS — missing columns
-- ============================================================================
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS user_id                 UUID,
  ADD COLUMN IF NOT EXISTS location                TEXT,
  ADD COLUMN IF NOT EXISTS source                  TEXT DEFAULT 'Manual',
  ADD COLUMN IF NOT EXISTS salary                  TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS url                     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes                   TEXT,
  ADD COLUMN IF NOT EXISTS date_applied            TIMESTAMPTZ DEFAULT now();

-- Add FK for jobs.user_id
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.jobs VALIDATE CONSTRAINT jobs_user_id_fkey;

-- Add status CHECK constraint (if not already present)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('Saved','Applied','Phone Screen','Interviewing','Offer','Rejected','Optimized'));

-- ============================================================================
-- 5. OPTIMIZED RESUMES — missing columns
-- ============================================================================
ALTER TABLE public.optimized_resumes
  ADD COLUMN IF NOT EXISTS missing_keywords JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optimized_data   JSONB;

-- Ensure FK exists (should already exist, but be safe)
ALTER TABLE public.optimized_resumes
  ADD CONSTRAINT optimized_resumes_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.optimized_resumes VALIDATE CONSTRAINT optimized_resumes_job_id_fkey;

ALTER TABLE public.optimized_resumes
  ADD CONSTRAINT optimized_resumes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.optimized_resumes VALIDATE CONSTRAINT optimized_resumes_user_id_fkey;

-- ============================================================================
-- 6. WORKFLOW_LOGS — missing columns
-- ============================================================================
ALTER TABLE public.workflow_logs
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Ensure FK exists
ALTER TABLE public.workflow_logs
  ADD CONSTRAINT workflow_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;
ALTER TABLE public.workflow_logs VALIDATE CONSTRAINT workflow_logs_user_id_fkey;

-- ============================================================================
-- 7. INDEXES (for performance)
-- ============================================================================
-- resumes: fast lookups by user and recent-first ordering
CREATE INDEX IF NOT EXISTS idx_resumes_user_id       ON public.resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at    ON public.resumes (created_at DESC);

-- jobs: filtering by user, status, source, search, and date ordering
CREATE INDEX IF NOT EXISTS idx_jobs_user_id          ON public.jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status           ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_source           ON public.jobs (source);
CREATE INDEX IF NOT EXISTS idx_jobs_date_applied     ON public.jobs (date_applied DESC);

-- optimized_resumes: lookups by job and user
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_job_id  ON public.optimized_resumes (job_id);
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_user_id ON public.optimized_resumes (user_id);

-- workflow_logs: lookups by user
CREATE INDEX IF NOT EXISTS idx_workflow_logs_user_id ON public.workflow_logs (user_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS (idempotent — safe to run if already enabled)
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_resumes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs      ENABLE ROW LEVEL SECURITY;

-- RLS policies (users see only their own data)
CREATE POLICY IF NOT EXISTS "Users can manage own profiles"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can manage own resumes"
  ON public.resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own jobs"
  ON public.jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own user_settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own optimized_resumes"
  ON public.optimized_resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own workflow_logs"
  ON public.workflow_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. TRIGGER: auto-update updated_at on user_settings
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 10. TRIGGER: auto-create profile on user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
