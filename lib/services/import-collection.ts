import { createClient } from "@/lib/supabase/server"
import { normalizeProductKey } from "@/lib/import/history-csv"
import type { CollectionRow, WishlistImportRow } from "@/lib/validations/import-collection"

export interface ImportCollectionSummary {
  imported: number
  skipped: number
  wishlistImported: number
  wishlistSkipped: number
  errors: string[]
}

export async function importCollectionRows(
  userId: string,
  rows: CollectionRow[],
  wishlistRows: WishlistImportRow[] = []
): Promise<ImportCollectionSummary> {
  const supabase = await createClient()
  const summary: ImportCollectionSummary = {
    imported: 0,
    skipped: 0,
    wishlistImported: 0,
    wishlistSkipped: 0,
    errors: [],
  }

  const { data: existingProducts, error: fetchError } = await supabase
    .from("products")
    .select("id,brand,name")
    .eq("user_id", userId)

  if (fetchError) {
    summary.errors.push(`Failed to load existing products: ${fetchError.message}`)
    return summary
  }

  // Map normalizedKey → product id for dedup
  const productByKey = new Map<string, string>()
  for (const p of existingProducts ?? []) {
    const key = normalizeProductKey(p.brand, p.name)
    if (!productByKey.has(key)) {
      productByKey.set(key, p.id)
    }
  }

  const now = new Date()
  const finishedMonth = now.getMonth() + 1
  const finishedYear = now.getFullYear()

  for (const row of rows) {
    const key = normalizeProductKey(row.brand, row.name)
    let productId = productByKey.get(key)

    if (!productId) {
      const { data: created, error: createError } = await supabase
        .from("products")
        .insert({
          user_id: userId,
          brand: row.brand,
          name: row.name,
          category: row.category,
          size_weight: row.sizeWeight,
          manufacture_date: row.manufactureDate,
          date_in_collection: row.dateInCollection,
          expiration_date: row.expirationDate,
        })
        .select("id")
        .single()

      if (createError || !created) {
        summary.errors.push(
          `Failed to create product "${row.name}": ${createError?.message ?? "unknown error"}`
        )
        continue
      }

      productId = created.id
      productByKey.set(key, productId)
    } else {
      // Update metadata on existing product (overwrites with freshest data from import)
      const { error: updateError } = await supabase
        .from("products")
        .update({
          size_weight: row.sizeWeight,
          manufacture_date: row.manufactureDate,
          date_in_collection: row.dateInCollection,
          expiration_date: row.expirationDate,
        })
        .eq("id", productId)
        .eq("user_id", userId)

      if (updateError) {
        summary.errors.push(
          `Failed to update product "${row.name}": ${updateError.message}`
        )
        continue
      }
    }

    if (row.isFinished) {
      const { data: panEntry, error: panError } = await supabase
        .from("pan_entries")
        .insert({
          user_id: userId,
          product_id: productId,
          status: "empty",
          usage_level: "just_started",
          started_month: finishedMonth,
          started_year: finishedYear,
        })
        .select("id")
        .single()

      if (panError || !panEntry) {
        if (panError?.code === "23505") {
          // Duplicate — product already has an entry this month
          summary.skipped++
          continue
        }
        summary.errors.push(
          `Failed to create pan entry for "${row.name}": ${panError?.message ?? "unknown error"}`
        )
        continue
      }

      const { error: emptyError } = await supabase.from("empties").insert({
        user_id: userId,
        pan_entry_id: panEntry.id,
        product_id: productId,
        finished_month: finishedMonth,
        finished_year: finishedYear,
      })

      if (emptyError) {
        // Roll back the pan_entry we just created
        await supabase
          .from("pan_entries")
          .delete()
          .eq("id", panEntry.id)
          .eq("user_id", userId)
        summary.errors.push(
          `Failed to create empty for "${row.name}": ${emptyError.message}`
        )
        continue
      }
    }

    summary.imported++
  }

  // Import wishlist items
  if (wishlistRows.length > 0) {
    // Load existing wishlist items for dedup (brand+name match)
    const { data: existingWishlist, error: wishlistFetchError } = await supabase
      .from("wishlist_items")
      .select("brand,name")
      .eq("user_id", userId)
      .is("purchased_at", null)

    if (wishlistFetchError) {
      summary.errors.push(`Failed to load existing wishlist: ${wishlistFetchError.message}`)
    } else {
      const wishlistKeySet = new Set<string>()
      for (const w of existingWishlist ?? []) {
        wishlistKeySet.add(normalizeProductKey(w.brand, w.name))
      }

      for (const row of wishlistRows) {
        const key = normalizeProductKey(row.brand, row.name)
        if (wishlistKeySet.has(key)) {
          summary.wishlistSkipped++
          continue
        }

        const { error: insertError } = await supabase
          .from("wishlist_items")
          .insert({
            user_id: userId,
            brand: row.brand,
            name: row.name,
          })

        if (insertError) {
          summary.errors.push(
            `Failed to add "${row.name}" to wishlist: ${insertError.message}`
          )
          continue
        }

        wishlistKeySet.add(key)
        summary.wishlistImported++
      }
    }
  }

  return summary
}
