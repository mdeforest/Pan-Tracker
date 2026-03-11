import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"
import type { WishlistStatus } from "@/lib/types/app"

type ServiceError = { message: string; code?: string }
type WishlistTable = Database["public"]["Tables"]["wishlist_items"]

async function userOwnsActiveProduct(userId: string, productId: string): Promise<boolean> {
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

function toNullableString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  return value
}

export async function listWishlistItems(userId: string, status: WishlistStatus) {
  const supabase = await createClient()

  let query = supabase
    .from("wishlist_items")
    .select("id,user_id,product_id,brand,name,notes,estimated_price,purchased_at,created_at")
    .eq("user_id", userId)

  if (status === "to_buy") {
    query = query.is("purchased_at", null).order("created_at", { ascending: false })
  } else if (status === "purchased") {
    query = query
      .not("purchased_at", "is", null)
      .order("purchased_at", { ascending: false })
      .order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  return query
}

export async function createWishlistItem(
  userId: string,
  input: {
    product_id?: string | null
    brand: string
    name: string
    notes?: string | null
    estimated_price?: number | null
  }
) {
  if (input.product_id) {
    const owned = await userOwnsActiveProduct(userId, input.product_id)
    if (!owned) {
      return {
        data: null,
        error: {
          message: "Product not found",
          code: "PGRST116",
        } satisfies ServiceError,
      }
    }
  }

  const supabase = await createClient()

  return supabase
    .from("wishlist_items")
    .insert({
      user_id: userId,
      product_id: input.product_id ?? null,
      brand: input.brand,
      name: input.name,
      notes: input.notes ?? null,
      estimated_price: input.estimated_price ?? null,
      purchased_at: null,
    })
    .select()
    .single()
}

export async function updateWishlistItem(
  userId: string,
  id: string,
  input: Partial<{
    product_id: string | null
    brand: string
    name: string
    notes: string | null
    estimated_price: number | null
    purchased: boolean
  }>
) {
  if (input.product_id) {
    const owned = await userOwnsActiveProduct(userId, input.product_id)
    if (!owned) {
      return {
        data: null,
        error: {
          message: "Product not found",
          code: "PGRST116",
        } satisfies ServiceError,
      }
    }
  }

  const updates: WishlistTable["Update"] = {}

  if (input.product_id !== undefined) {
    updates.product_id = input.product_id
  }
  if (input.brand !== undefined) {
    updates.brand = input.brand
  }
  if (input.name !== undefined) {
    updates.name = input.name
  }
  if (input.notes !== undefined) {
    updates.notes = toNullableString(input.notes)
  }
  if (input.estimated_price !== undefined) {
    updates.estimated_price = input.estimated_price
  }
  if (input.purchased !== undefined) {
    updates.purchased_at = input.purchased ? new Date().toISOString() : null
  }

  const supabase = await createClient()

  return supabase
    .from("wishlist_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()
}

export async function buyWishlistItem(
  userId: string,
  id: string
): Promise<{ data: null; error: { message: string; code?: string } } | { data: true; error: null }> {
  const supabase = await createClient()

  // Fetch the item to get product_id, brand, name
  const { data: item, error: fetchError } = await supabase
    .from("wishlist_items")
    .select("id,product_id,brand,name")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return { data: null, error: { message: "Wishlist item not found", code: "PGRST116" } }
    }
    return { data: null, error: { message: fetchError.message, code: fetchError.code } }
  }

  if (!item) {
    return { data: null, error: { message: "Wishlist item not found", code: "PGRST116" } }
  }

  const now = new Date().toISOString()

  if (item.product_id) {
    // Linked product — update last_bought_at
    const { error: updateError } = await supabase
      .from("products")
      .update({ last_bought_at: now })
      .eq("id", item.product_id)
      .eq("user_id", userId)

    if (updateError) {
      return { data: null, error: { message: updateError.message } }
    }
  } else {
    // Unlinked — create new product with last_bought_at
    const { error: insertError } = await supabase
      .from("products")
      .insert({
        user_id: userId,
        brand: item.brand,
        name: item.name,
        category: "other",
        last_bought_at: now,
      })

    if (insertError) {
      return { data: null, error: { message: insertError.message } }
    }
  }

  // Delete the wishlist item
  const { error: deleteError } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (deleteError) {
    return { data: null, error: { message: deleteError.message } }
  }

  return { data: true, error: null }
}

export async function deleteWishlistItem(userId: string, id: string) {
  const supabase = await createClient()

  return supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()
}
