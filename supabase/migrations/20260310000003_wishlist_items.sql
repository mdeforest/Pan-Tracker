-- Wishlist items for post-pan rewards and replacement planning.

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id      uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  brand           text        NOT NULL CHECK (char_length(btrim(brand)) > 0),
  name            text        NOT NULL CHECK (char_length(btrim(name)) > 0),
  notes           text,
  estimated_price numeric(10,2) CHECK (estimated_price IS NULL OR estimated_price >= 0),
  purchased_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wishlist_items_user_purchased_at_idx
  ON public.wishlist_items(user_id, purchased_at);

CREATE INDEX IF NOT EXISTS wishlist_items_user_created_at_idx
  ON public.wishlist_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wishlist_items_user_product_id_idx
  ON public.wishlist_items(user_id, product_id)
  WHERE product_id IS NOT NULL;

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_items_select_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_select_own" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlist_items_insert_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_insert_own" ON public.wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlist_items_update_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_update_own" ON public.wishlist_items
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlist_items_delete_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_delete_own" ON public.wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_wishlist_item_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  product_owner_id uuid;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT user_id
    INTO product_owner_id
    FROM public.products
    WHERE id = NEW.product_id;

    IF product_owner_id IS NULL OR product_owner_id <> NEW.user_id THEN
      RAISE EXCEPTION 'wishlist product must belong to the same user'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wishlist_items_enforce_ownership ON public.wishlist_items;

CREATE TRIGGER wishlist_items_enforce_ownership
  BEFORE INSERT OR UPDATE ON public.wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_wishlist_item_ownership();

-- rollback:
-- DROP TRIGGER IF EXISTS wishlist_items_enforce_ownership ON public.wishlist_items;
-- DROP FUNCTION IF EXISTS public.enforce_wishlist_item_ownership();
-- DROP POLICY IF EXISTS "wishlist_items_delete_own" ON public.wishlist_items;
-- DROP POLICY IF EXISTS "wishlist_items_update_own" ON public.wishlist_items;
-- DROP POLICY IF EXISTS "wishlist_items_insert_own" ON public.wishlist_items;
-- DROP POLICY IF EXISTS "wishlist_items_select_own" ON public.wishlist_items;
-- DROP INDEX IF EXISTS wishlist_items_user_product_id_idx;
-- DROP INDEX IF EXISTS wishlist_items_user_created_at_idx;
-- DROP INDEX IF EXISTS wishlist_items_user_purchased_at_idx;
-- DROP TABLE IF EXISTS public.wishlist_items;
