-- Replace the product_category enum with Sophia-specific categories
-- Migrate all existing data to 'miscellaneous' as a safe fallback
--
-- NOTE: `ALTER TYPE ... ADD VALUE` cannot be used in the same transaction as DML
-- that references the new value. To avoid that restriction we skip ADD VALUE
-- entirely: cast to text first, do the migration as text, then recreate the enum.

-- Step 1: Cast the column to text so we can freely manipulate values
ALTER TABLE public.products
  ALTER COLUMN category TYPE text;

-- Step 2: Drop the old enum (no longer referenced by the column)
DROP TYPE IF EXISTS public.product_category;

-- Step 3: Migrate old category values to the closest new equivalent
UPDATE public.products SET category = 'miscellaneous'
  WHERE category IN ('makeup', 'skincare', 'haircare', 'bodycare', 'fragrance', 'tools', 'other');

-- Step 4: Create the new enum with Sophia-specific categories
CREATE TYPE public.product_category AS ENUM (
  'mascara',
  'cleanser',
  'serum',
  'moisturizer',
  'mist',
  'eye_cream',
  'toner',
  'miscellaneous'
);

-- Step 5: Cast the column back to the new enum type
ALTER TABLE public.products
  ALTER COLUMN category TYPE public.product_category
  USING category::public.product_category;
