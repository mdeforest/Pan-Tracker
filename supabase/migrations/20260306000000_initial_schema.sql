-- =============================================================================
-- Project Pan Tracker — Initial Schema
-- PRD Section 8 Data Model
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.product_category AS ENUM (
  'makeup', 'skincare', 'haircare', 'bodycare', 'fragrance', 'tools', 'other'
);

CREATE TYPE public.pan_entry_status AS ENUM (
  'active', 'empty', 'paused'
);

CREATE TYPE public.usage_level AS ENUM (
  'just_started', 'quarter', 'half', 'three_quarters', 'almost_done'
);

CREATE TYPE public.would_repurchase AS ENUM (
  'yes', 'no', 'maybe'
);

-- ---------------------------------------------------------------------------
-- Table: public.users
-- Mirrors auth.users; populated by trigger on first sign-in.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL UNIQUE,
  name        text,
  avatar_url  text,
  google_id   text        NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Table: public.products
-- User's product library. Soft-deleted via archived_at.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id          uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid                    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brand       text                    NOT NULL,
  name        text                    NOT NULL,
  category    public.product_category NOT NULL,
  photo_url   text,
  notes       text,
  archived_at timestamptz,
  created_at  timestamptz             NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_user_id_archived_at_idx
  ON public.products(user_id, archived_at);

-- ---------------------------------------------------------------------------
-- Table: public.pan_entries
-- Products currently being tracked in the pan.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pan_entries (
  id            uuid                   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid                   NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id    uuid                   NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  status        public.pan_entry_status NOT NULL DEFAULT 'active',
  usage_level   public.usage_level      NOT NULL DEFAULT 'just_started',
  started_month integer                 NOT NULL CHECK (started_month BETWEEN 1 AND 12),
  started_year  integer                 NOT NULL,
  notes         text,
  created_at    timestamptz             NOT NULL DEFAULT now(),
  updated_at    timestamptz             NOT NULL DEFAULT now()
);

-- One active entry per product per user
CREATE UNIQUE INDEX IF NOT EXISTS pan_entries_active_unique_idx
  ON public.pan_entries(user_id, product_id)
  WHERE (status = 'active');

CREATE INDEX IF NOT EXISTS pan_entries_user_id_idx
  ON public.pan_entries(user_id);

-- ---------------------------------------------------------------------------
-- Table: public.monthly_picks
-- Which pan entries are focus picks for a given month/year.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.monthly_picks (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pan_entry_id            uuid        NOT NULL REFERENCES public.pan_entries(id) ON DELETE CASCADE,
  month                   integer     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                    integer     NOT NULL,
  carried_over_from_month integer,
  carried_over_from_year  integer,
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pan_entry_id, month, year)
);

CREATE INDEX IF NOT EXISTS monthly_picks_user_month_year_idx
  ON public.monthly_picks(user_id, month, year);

-- ---------------------------------------------------------------------------
-- Table: public.empties
-- Completed products with review data.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.empties (
  id                     uuid                     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid                     NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pan_entry_id           uuid                     NOT NULL REFERENCES public.pan_entries(id) ON DELETE RESTRICT,
  product_id             uuid                     NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  finished_month         integer                  NOT NULL CHECK (finished_month BETWEEN 1 AND 12),
  finished_year          integer                  NOT NULL,
  rating                 integer                  CHECK (rating BETWEEN 1 AND 5),
  would_repurchase       public.would_repurchase,
  review_notes           text,
  replacement_product_id uuid                     REFERENCES public.products(id) ON DELETE SET NULL,
  replacement_free_text  text,
  created_at             timestamptz              NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS empties_user_finished_idx
  ON public.empties(user_id, finished_year, finished_month DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pan_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empties      ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id);

-- products
CREATE POLICY "products_select_own" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products_delete_own" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- pan_entries
CREATE POLICY "pan_entries_select_own" ON public.pan_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pan_entries_insert_own" ON public.pan_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pan_entries_update_own" ON public.pan_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pan_entries_delete_own" ON public.pan_entries FOR DELETE USING (auth.uid() = user_id);

-- monthly_picks
CREATE POLICY "monthly_picks_select_own" ON public.monthly_picks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monthly_picks_insert_own" ON public.monthly_picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_picks_update_own" ON public.monthly_picks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "monthly_picks_delete_own" ON public.monthly_picks FOR DELETE USING (auth.uid() = user_id);

-- empties
CREATE POLICY "empties_select_own" ON public.empties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "empties_insert_own" ON public.empties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "empties_update_own" ON public.empties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "empties_delete_own" ON public.empties FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create public.users row on first Google sign-in
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, google_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'provider_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: auto-update pan_entries.updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER pan_entries_set_updated_at
  BEFORE UPDATE ON public.pan_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
