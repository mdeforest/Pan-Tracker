-- Add onboarding completion tracking to the users table.
-- Null = user has not seen the tutorial.
-- Non-null = timestamp when the user completed or skipped the tutorial.
-- Using timestamptz rather than boolean to support future analytics.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- rollback: ALTER TABLE public.users DROP COLUMN IF EXISTS onboarding_completed_at;
