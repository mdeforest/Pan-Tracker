import { createClient } from "@/lib/supabase/server"

interface ServiceError {
  message: string
}

/**
 * Creates a demo product and pan entry for the current month so the tutorial
 * has real content to spotlight. Returns the IDs for cleanup.
 */
export async function createTutorialData(
  userId: string,
  year: number,
  month: number
): Promise<{
  data: { productId: string; panEntryId: string } | null
  error: ServiceError | null
}> {
  const supabase = await createClient()

  // 1. Create demo product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      name: "Tutorial Blush",
      brand: "Demo Co.",
      category: "makeup",
    })
    .select("id")
    .single()

  if (productError || !product) {
    console.error("createTutorialData: product insert failed", { userId, message: productError?.message })
    return { data: null, error: { message: productError?.message ?? "Failed to create demo product" } }
  }

  // 2. Create pan entry at quarter usage so the progress bar is visible
  const { data: entry, error: entryError } = await supabase
    .from("pan_entries")
    .insert({
      user_id: userId,
      product_id: product.id,
      started_year: year,
      started_month: month,
      status: "active",
      usage_level: "quarter",
    })
    .select("id")
    .single()

  if (entryError || !entry) {
    console.error("createTutorialData: pan_entry insert failed", { userId, message: entryError?.message })
    // Roll back the product we just created
    await supabase.from("products").delete().eq("id", product.id).eq("user_id", userId)
    return { data: null, error: { message: entryError?.message ?? "Failed to create demo pan entry" } }
  }

  return { data: { productId: product.id, panEntryId: entry.id }, error: null }
}

/**
 * Hard-deletes the demo pan entry and product created for the tutorial.
 * Pan entry must be deleted before the product (FK constraint).
 */
export async function deleteTutorialData(
  userId: string,
  panEntryId: string,
  productId: string
): Promise<{
  data: { deleted: true } | null
  error: ServiceError | null
}> {
  const supabase = await createClient()

  const { error: entryError } = await supabase
    .from("pan_entries")
    .delete()
    .eq("id", panEntryId)
    .eq("user_id", userId)

  if (entryError) {
    console.error("deleteTutorialData: pan_entry delete failed", { userId, panEntryId, message: entryError.message })
    return { data: null, error: { message: entryError.message } }
  }

  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId)

  if (productError) {
    console.error("deleteTutorialData: product delete failed", { userId, productId, message: productError.message })
    return { data: null, error: { message: productError.message } }
  }

  return { data: { deleted: true }, error: null }
}
