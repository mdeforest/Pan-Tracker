import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type ProductCategory = Database["public"]["Enums"]["product_category"]

export async function listProducts(userId: string, q?: string, category?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
  }
  if (category) {
    query = query.eq("category", category as ProductCategory)
  }

  return query
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
  const supabase = await createClient()

  return supabase
    .from("products")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()
}
