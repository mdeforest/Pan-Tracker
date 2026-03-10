import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type WouldRepurchase = Database["public"]["Enums"]["would_repurchase"]
type ProductCategory = Database["public"]["Enums"]["product_category"]

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
    product_id: string
    finished_month: number
    finished_year: number
    rating?: number
    would_repurchase?: WouldRepurchase
    review_notes?: string
    replacement_product_id?: string
    replacement_free_text?: string
  }
) {
  const supabase = await createClient()

  const { data: empty, error: emptyError } = await supabase
    .from("empties")
    .insert({
      user_id: userId,
      pan_entry_id: input.pan_entry_id,
      product_id: input.product_id,
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
