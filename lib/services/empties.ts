import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type WouldRepurchase = Database["public"]["Enums"]["would_repurchase"]
type ProductCategory = Database["public"]["Enums"]["product_category"]
type ServiceError = { message: string; code?: string }

async function userOwnsProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", userId)
    .is("archived_at", null)
    .single()

  return !error && !!data
}

async function getOwnedPanEntryProductId(
  userId: string,
  panEntryId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pan_entries")
    .select("product_id")
    .eq("id", panEntryId)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return null
  }

  return data.product_id
}

export async function listEmpties(
  userId: string,
  filters: { year?: number; month?: number; category?: string }
) {
  const supabase = await createClient()

  let query = supabase
    .from("empties")
    .select("*, products!empties_product_id_fkey(*), pan_entries(*)")
    .eq("user_id", userId)
    .order("finished_year", { ascending: false })
    .order("finished_month", { ascending: false })

  if (filters.year) {
    query = query.eq("finished_year", filters.year)
  }
  if (filters.month) {
    query = query.eq("finished_month", filters.month)
  }
  if (filters.category) {
    query = query.eq("products!empties_product_id_fkey.category", filters.category as ProductCategory)
  }

  return query
}

export async function createEmpty(
  userId: string,
  input: {
    pan_entry_id: string
    finished_month: number
    finished_year: number
    rating?: number
    would_repurchase?: WouldRepurchase
    review_notes?: string
    replacement_product_id?: string
    replacement_free_text?: string
  }
) {
  const [productId, replacementOwned] = await Promise.all([
    getOwnedPanEntryProductId(userId, input.pan_entry_id),
    input.replacement_product_id
      ? userOwnsProduct(userId, input.replacement_product_id)
      : Promise.resolve(true),
  ])

  if (!productId) {
    return {
      data: null,
      error: {
        message: "Pan entry not found",
        code: "PGRST116",
      } satisfies ServiceError,
    }
  }

  if (input.replacement_product_id && !replacementOwned) {
    return {
      data: null,
      error: {
        message: "Replacement product not found",
        code: "PGRST116",
      } satisfies ServiceError,
    }
  }

  const supabase = await createClient()

  const { data: empty, error: emptyError } = await supabase
    .from("empties")
    .insert({
      user_id: userId,
      pan_entry_id: input.pan_entry_id,
      product_id: productId,
      finished_month: input.finished_month,
      finished_year: input.finished_year,
      rating: input.rating ?? null,
      would_repurchase: input.would_repurchase ?? null,
      review_notes: input.review_notes ?? null,
      replacement_product_id: input.replacement_product_id ?? null,
      replacement_free_text: input.replacement_free_text ?? null,
    })
    .select("*, products!empties_product_id_fkey(*), pan_entries(*)")
    .single()

  if (emptyError) {
    console.error("createEmpty: failed to insert empty", { userId, error: emptyError.message })
    return { data: null, error: emptyError }
  }

  const { error: updateError } = await supabase
    .from("pan_entries")
    .update({ status: "empty", updated_at: new Date().toISOString() })
    .eq("id", input.pan_entry_id)
    .eq("user_id", userId)

  if (updateError) {
    console.error("createEmpty: failed to update pan_entry status", {
      pan_entry_id: input.pan_entry_id,
      userId,
      error: updateError.message,
    })
    return { data: null, error: updateError }
  }

  return { data: empty, error: null }
}
