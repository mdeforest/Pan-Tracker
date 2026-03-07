import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server-admin"
import type { Database } from "@/lib/types/database"

type PanEntryStatus = Database["public"]["Enums"]["pan_entry_status"]
type UsageLevel = Database["public"]["Enums"]["usage_level"]

export async function getPanEntries(userId: string, year: number, month: number) {
  const supabase = await createClient()

  const [entriesResult, picksResult] = await Promise.all([
    supabase
      .from("pan_entries")
      .select("*, products(*)")
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
    .select("*, products(*)")
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
    .select("*, products(*)")
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
    .select("*, products(*)")
    .single()
}

export async function carryOverEntries(
  userId: string,
  productIds: string[],
  targetYear: number,
  targetMonth: number
) {
  const admin = createAdminClient()

  const results = await Promise.allSettled(
    productIds.map((productId) =>
      admin
        .from("pan_entries")
        .insert({
          user_id: userId,
          product_id: productId,
          started_month: targetMonth,
          started_year: targetYear,
          status: "active" as const,
          usage_level: "just_started" as const,
        })
        .select()
        .single()
    )
  )

  const created = results
    .filter((r) => r.status === "fulfilled" && r.value.error === null)
    .map((r) => (r as PromiseFulfilledResult<{ data: unknown }>).value.data)

  return { data: created, error: null }
}
