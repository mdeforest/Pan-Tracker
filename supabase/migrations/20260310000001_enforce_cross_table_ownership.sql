-- Enforce same-user ownership across cross-table references used by app mutations.

CREATE OR REPLACE FUNCTION public.enforce_pan_entry_product_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT user_id
  INTO owner_id
  FROM public.products
  WHERE id = NEW.product_id;

  IF owner_id IS NULL OR owner_id <> NEW.user_id THEN
    RAISE EXCEPTION 'pan entry product must belong to the same user'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pan_entries_enforce_product_ownership ON public.pan_entries;

CREATE TRIGGER pan_entries_enforce_product_ownership
  BEFORE INSERT OR UPDATE ON public.pan_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_pan_entry_product_ownership();

CREATE OR REPLACE FUNCTION public.enforce_empty_ownership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pan_entry_user_id uuid;
  pan_entry_product_id uuid;
  replacement_owner_id uuid;
BEGIN
  SELECT user_id, product_id
  INTO pan_entry_user_id, pan_entry_product_id
  FROM public.pan_entries
  WHERE id = NEW.pan_entry_id;

  IF pan_entry_user_id IS NULL OR pan_entry_user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'empty pan entry must belong to the same user'
      USING ERRCODE = '42501';
  END IF;

  IF pan_entry_product_id <> NEW.product_id THEN
    RAISE EXCEPTION 'empty product must match the pan entry product'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.replacement_product_id IS NOT NULL THEN
    SELECT user_id
    INTO replacement_owner_id
    FROM public.products
    WHERE id = NEW.replacement_product_id;

    IF replacement_owner_id IS NULL OR replacement_owner_id <> NEW.user_id THEN
      RAISE EXCEPTION 'replacement product must belong to the same user'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS empties_enforce_ownership ON public.empties;

CREATE TRIGGER empties_enforce_ownership
  BEFORE INSERT OR UPDATE ON public.empties
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_empty_ownership();
