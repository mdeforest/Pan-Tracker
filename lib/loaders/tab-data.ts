import { unstable_cache } from "next/cache"
import type { EmptyCardData } from "@/components/empties/EmptyCard"
import type { PanEntryWithProduct } from "@/components/pan/types"
import { emptiesTabTag, panMonthTabTag, panTabTag, productsTabTag, statsTabTag } from "@/lib/cache/tab-cache"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { ProductCategory, WouldRepurchase } from "@/lib/types/app"
import { getStatsData, type StatsData } from "@/lib/services/stats"

const TAB_REVALIDATE_SECONDS = 30

export interface RawProduct {
  id: string
  name: string
  brand: string
  category: string
  photo_url: string | null
  archived_at: string | null
}

interface PanTabData {
  entries: PanEntryWithProduct[]
  error: string | null
}

interface ProductsTabData {
  activeProductIds: string[]
  initialProducts: RawProduct[]
}

interface EmptiesTabData {
  empties: EmptyCardData[]
}

export async function getPanTabData(
  userId: string,
  year: number,
  month: number
): Promise<PanTabData> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()

      const [entriesResult, picksResult] = await Promise.all([
        supabase
          .from("pan_entries")
          .select(
            "id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at,products(id,name,brand,category,photo_url)"
          )
          .eq("user_id", userId)
          .eq("started_year", year)
          .eq("started_month", month)
          .in("status", ["active", "paused"])
          .order("created_at", { ascending: false }),
        supabase
          .from("monthly_picks")
          .select("pan_entry_id")
          .eq("user_id", userId)
          .eq("month", month)
          .eq("year", year),
      ])

      if (entriesResult.error) {
        console.error("getPanTabData: failed to fetch pan entries", {
          userId,
          year,
          month,
          error: entriesResult.error.message,
        })
        return { entries: [], error: entriesResult.error.message }
      }

      const pickIds = new Set((picksResult.data ?? []).map((pick) => pick.pan_entry_id))

      // Supabase types `products` as an array due to relationship config, but runtime gives
      // a single object.
      const entries = ((entriesResult.data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>
        const rawProducts = r.products
        const product = Array.isArray(rawProducts)
          ? (rawProducts[0] ?? null)
          : (rawProducts ?? null)

        return {
          ...r,
          products: product,
          is_pick: pickIds.has(r.id as string),
        } as PanEntryWithProduct
      })

      return { entries, error: null }
    },
    ["tab-pan-data", userId, String(year), String(month)],
    {
      revalidate: TAB_REVALIDATE_SECONDS,
      tags: [panTabTag(userId), panMonthTabTag(userId, year, month)],
    }
  )()
}

export async function getProductsTabData(userId: string): Promise<ProductsTabData> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const [{ data: activeEntries }, { data: initialProducts }] = await Promise.all([
        supabase
          .from("pan_entries")
          .select("product_id")
          .eq("user_id", userId)
          .eq("status", "active"),
        supabase
          .from("products")
          .select("id,name,brand,category,photo_url,archived_at")
          .eq("user_id", userId)
          .is("archived_at", null)
          .order("created_at", { ascending: false }),
      ])

      return {
        activeProductIds: (activeEntries ?? []).map((entry) => entry.product_id),
        initialProducts: (initialProducts ?? []) as RawProduct[],
      }
    },
    ["tab-products-data", userId],
    {
      revalidate: TAB_REVALIDATE_SECONDS,
      tags: [productsTabTag(userId)],
    }
  )()
}

export async function getEmptiesTabData(userId: string): Promise<EmptiesTabData> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("empties")
        .select(
          "id,finished_month,finished_year,rating,would_repurchase,review_notes,replacement_free_text,products:products!empties_product_id_fkey(id,name,brand,category,photo_url)"
        )
        .eq("user_id", userId)
        .order("finished_year", { ascending: false })
        .order("finished_month", { ascending: false })
      if (error) {
        console.error("getEmptiesTabData: failed to fetch empties", {
          userId,
          error: error.message,
        })
        return { empties: [] }
      }

      const empties: EmptyCardData[] = ((data ?? []) as unknown[]).map((row) => {
        const r = row as Record<string, unknown>
        const rawProduct = r.products
        const product = Array.isArray(rawProduct)
          ? (rawProduct[0] ?? null)
          : (rawProduct ?? null)

        return {
          id: r.id as string,
          finished_month: r.finished_month as number,
          finished_year: r.finished_year as number,
          rating: (r.rating as number | null) ?? null,
          would_repurchase: (r.would_repurchase as WouldRepurchase | null) ?? null,
          review_notes: (r.review_notes as string | null) ?? null,
          replacement_free_text: (r.replacement_free_text as string | null) ?? null,
          products: product
            ? {
                id: (product as Record<string, unknown>).id as string,
                name: (product as Record<string, unknown>).name as string,
                brand: (product as Record<string, unknown>).brand as string,
                category: (product as Record<string, unknown>).category as ProductCategory,
                photo_url: ((product as Record<string, unknown>).photo_url as string | null) ?? null,
              }
            : null,
        }
      })

      return { empties }
    },
    ["tab-empties-data", userId],
    {
      revalidate: TAB_REVALIDATE_SECONDS,
      tags: [emptiesTabTag(userId)],
    }
  )()
}

export async function getStatsTabData(userId: string): Promise<StatsData> {
  return unstable_cache(
    () => getStatsData(userId),
    ["tab-stats-data", userId],
    {
      revalidate: TAB_REVALIDATE_SECONDS,
      tags: [statsTabTag(userId)],
    }
  )()
}
