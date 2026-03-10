-- Improve tab-switch query latency for products and pan month views.

CREATE INDEX IF NOT EXISTS products_user_archived_created_desc_idx
  ON public.products(user_id, archived_at, created_at DESC);

CREATE INDEX IF NOT EXISTS pan_entries_user_period_status_created_desc_idx
  ON public.pan_entries(user_id, started_year, started_month, status, created_at DESC);
