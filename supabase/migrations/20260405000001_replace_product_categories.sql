-- Replace the product_category enum with Sophia-specific categories
-- Migrate all existing data to 'miscellaneous' as a safe fallback

-- Step 1: Add new enum values
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'mascara';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'cleanser';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'serum';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'moisturizer';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'mist';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'eye_cream';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'toner';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'miscellaneous';

-- Step 2: Migrate existing rows to new categories
UPDATE public.products SET category = 'miscellaneous'
  WHERE category IN ('makeup', 'skincare', 'haircare', 'bodycare', 'fragrance', 'tools', 'other');

-- Step 3: Remove old values by recreating the type
-- (PostgreSQL doesn't support DROP VALUE, so we recreate)
ALTER TABLE public.products
  ALTER COLUMN category TYPE text;

DROP TYPE public.product_category;

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

ALTER TABLE public.products
  ALTER COLUMN category TYPE public.product_category
  USING category::public.product_category;
