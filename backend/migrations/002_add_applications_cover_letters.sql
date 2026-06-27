-- ============================================================================
-- Migration 002: Applications + Cover Letters tables
-- Required for n8n workflow automation (application tracking + cover letter storage)
-- ============================================================================

-- ============================================================================
-- 1. APPLICATIONS TABLE
-- Tracks every job a user has applied to, with interview and follow-up dates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'Applied'
                    CHECK (status IN ('Applied','Phone Screen','Interviewing','Offer','Rejected','Withdrawn','Archived')),
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  interview_at    TIMESTAMPTZ,
  follow_up_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id  ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id   ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON public.applications(status);

-- ============================================================================
-- 2. COVER LETTERS TABLE
-- Stores AI-generated cover letters linked to a user, job, and resume version
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_id       UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  tone            TEXT DEFAULT 'professional',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id  ON public.cover_letters(job_id);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================
ALTER TABLE public.applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own applications"
  ON public.applications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can manage own cover_letters"
  ON public.cover_letters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. AUTO-UPDATE updated_at ON applications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_touch ON public.applications;
CREATE TRIGGER applications_touch
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
