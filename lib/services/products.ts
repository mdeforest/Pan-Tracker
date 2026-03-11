import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type ProductCategory = Database["public"]["Enums"]["product_category"]
type ServiceError = { message: string; code?: string }

async function hasActivePanEntry(userId: string, productId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pan_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle()

  return !error && !!data
}

export async function listProducts(
  userId: string,
  q?: string,
  category?: string,
  includeArchived = false
) {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("id,name,brand,category,photo_url,archived_at,last_bought_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!includeArchived) {
    query = query.is("archived_at", null)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
  }
  if (category) {
    query = query.eq("category", category as ProductCategory)
  }

  return query
}

export async function getProduct(userId: string, id: string) {
  const supabase = await createClient()

  return supabase
    .from("products")
    .select("id,name,brand,category,photo_url,notes,archived_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single()
}

export async function getProductPanHistory(userId: string, productId: string) {
  const supabase = await createClient()

  return supabase
    .from("pan_entries")
    .select(
      "id,started_month,started_year,status,usage_level,notes,empties(id,finished_month,finished_year,rating,would_repurchase,review_notes,replacement_free_text)"
    )
    .eq("user_id", userId)
    .eq("product_id", productId)
    .order("started_year", { ascending: false })
    .order("started_month", { ascending: false })
}

export async function createProduct(
  userId: string,
  input: {
    brand: string
    name: string
    category: ProductCategory
    notes?: string | null
    photo_url?: string | null
  }
) {
  const supabase = await createClient()

  return supabase
    .from("products")
    .insert({
      user_id: userId,
      brand: input.brand,
      name: input.name,
      category: input.category,
      notes: input.notes ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select()
    .single()
}

export async function updateProduct(
  userId: string,
  id: string,
  input: Partial<{
    brand: string
    name: string
    category: ProductCategory
    notes: string | null
    photo_url: string | null
  }>
) {
  const supabase = await createClient()

  return supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .is("archived_at", null)
    .select()
    .single()
}

export async function archiveProduct(userId: string, id: string) {
  if (await hasActivePanEntry(userId, id)) {
    return {
      data: null,
      error: {
        message: "Cannot archive a product that is currently in your pan",
        code: "PRODUCT_IN_ACTIVE_PAN",
      } satisfies ServiceError,
    }
  }

  const supabase = await createClient()

  return supabase
    .from("products")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("archived_at", null)
    .select()
    .single()
}

export async function restoreProduct(userId: string, id: string) {
  const supabase = await createClient()

  return supabase
    .from("products")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", userId)
    .not("archived_at", "is", null)
    .select()
    .single()
}
