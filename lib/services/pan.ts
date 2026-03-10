import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/types/database"

type PanEntryStatus = Database["public"]["Enums"]["pan_entry_status"]
type UsageLevel = Database["public"]["Enums"]["usage_level"]
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

async function userOwnsProducts(
  userId: string,
  productIds: string[]
): Promise<boolean> {
  if (productIds.length === 0) {
    return true
  }

  const supabase = await createClient()
  const uniqueIds = Array.from(new Set(productIds))
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .is("archived_at", null)
    .in("id", uniqueIds)

  return !error && (data?.length ?? 0) === uniqueIds.length
}

export async function getPanEntries(userId: string, year: number, month: number) {
  const supabase = await createClient()

  const [entriesResult, picksResult] = await Promise.all([
    supabase
      .from("pan_entries")
      .select(
        "id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at,products(id,name,brand,category,photo_url)"
      )
      .eq("user_id", userId)
      .in("status", ["active", "paused"] as PanEntryStatus[])
      .order("created_at", { ascending: false }),
    supabase
      .from("monthly_picks")
      .select("pan_entry_id")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year),
  ])

  return { entriesResult, picksResult }
}

export async function getPanEntry(userId: string, id: string) {
  const supabase = await createClient()

  return supabase
    .from("pan_entries")
    .select(
      "id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at,products(id,name,brand,category,photo_url)"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single()
}

export async function addToPan(
  userId: string,
  productId: string,
  year: number,
  month: number
) {
  if (!(await userOwnsProduct(userId, productId))) {
    return {
      data: null,
      error: {
        message: "Product not found",
        code: "PGRST116",
      } satisfies ServiceError,
    }
  }

  const supabase = await createClient()

  return supabase
    .from("pan_entries")
    .insert({
      user_id: userId,
      product_id: productId,
      started_month: month,
      started_year: year,
      status: "active",
      usage_level: "just_started",
    })
    .select(
      "id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at,products(id,name,brand,category,photo_url)"
    )
    .single()
}

export async function updatePanEntry(
  userId: string,
  id: string,
  input: { usage_level?: UsageLevel; notes?: string | null; status?: PanEntryStatus }
) {
  const supabase = await createClient()

  return supabase
    .from("pan_entries")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select(
      "id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at,products(id,name,brand,category,photo_url)"
    )
    .single()
}

export async function carryOverEntries(
  userId: string,
  productIds: string[],
  targetYear: number,
  targetMonth: number
) {
  if (!(await userOwnsProducts(userId, productIds))) {
    return {
      data: null,
      error: {
        message: "One or more products were not found",
        code: "PGRST116",
      } satisfies ServiceError,
    }
  }

  const supabase = await createClient()
  const uniqueIds = Array.from(new Set(productIds))

  return supabase
    .from("pan_entries")
    .insert(
      uniqueIds.map((productId) => ({
        user_id: userId,
        product_id: productId,
        started_month: targetMonth,
        started_year: targetYear,
        status: "active" as const,
        usage_level: "just_started" as const,
      }))
    )
    .select("id,user_id,product_id,status,usage_level,started_month,started_year,notes,created_at,updated_at")
}
