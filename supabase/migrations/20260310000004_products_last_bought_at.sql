-- Add last_bought_at to products.
-- Existing products backfill to created_at; new products default to NOW().

-- Step 1: Add nullable first so we can backfill before setting NOT NULL.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS last_bought_at timestamptz;

-- Step 2: Backfill existing rows — use created_at as their initial "last bought" date.
UPDATE public.products
  SET last_bought_at = created_at
  WHERE last_bought_at IS NULL;

-- Step 3: Lock it down — new inserts default to NOW(), column is always populated.
ALTER TABLE public.products
  ALTER COLUMN last_bought_at SET NOT NULL,
  ALTER COLUMN last_bought_at SET DEFAULT NOW();

-- Rollback: ALTER TABLE public.products DROP COLUMN IF EXISTS last_bought_at;
