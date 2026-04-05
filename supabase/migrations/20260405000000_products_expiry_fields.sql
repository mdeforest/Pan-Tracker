-- Add product metadata fields for collection tracking and expiry recommendations
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size_weight       text,
  ADD COLUMN IF NOT EXISTS manufacture_date  date,
  ADD COLUMN IF NOT EXISTS date_in_collection date,
  ADD COLUMN IF NOT EXISTS expiration_date   date;

-- Index for expiry shelf query (backlog products expiring soon)
CREATE INDEX IF NOT EXISTS products_user_id_expiration_date_idx
  ON public.products(user_id, expiration_date)
  WHERE expiration_date IS NOT NULL;
