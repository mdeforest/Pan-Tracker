import { createClient } from "@/lib/supabase/server"

type ServiceError = { message: string; code?: string }

async function userOwnsActivePanEntries(userId: string, panEntryIds: string[]): Promise<boolean> {
  if (panEntryIds.length === 0) {
    return true
  }

  const supabase = await createClient()
  const uniqueIds = Array.from(new Set(panEntryIds))
  const { data, error } = await supabase
    .from("pan_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("id", uniqueIds)

  return !error && (data?.length ?? 0) === uniqueIds.length
}

export async function listPicks(userId: string, month: number, year: number) {
  const supabase = await createClient()

  return supabase
    .from("monthly_picks")
    .select("id,user_id,pan_entry_id,month,year,carried_over_from_month,carried_over_from_year,created_at")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false })
}

export async function setPicks(
  userId: string,
  panEntryIds: string[],
  month: number,
  year: number
) {
  if (!(await userOwnsActivePanEntries(userId, panEntryIds))) {
    return {
      data: null,
      error: {
        message: "One or more pan entries were not found or are not active",
        code: "PGRST116",
      } satisfies ServiceError,
    }
  }

  const supabase = await createClient()

  const deleteResult = await supabase
    .from("monthly_picks")
    .delete()
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)

  if (deleteResult.error) {
    return { data: null, error: deleteResult.error }
  }

  const uniqueIds = Array.from(new Set(panEntryIds))
  if (uniqueIds.length === 0) {
    return { data: [], error: null }
  }

  return supabase
    .from("monthly_picks")
    .insert(
      uniqueIds.map((panEntryId) => ({
        user_id: userId,
        pan_entry_id: panEntryId,
        month,
        year,
      }))
    )
    .select("id,user_id,pan_entry_id,month,year,carried_over_from_month,carried_over_from_year,created_at")
}

export async function deletePick(userId: string, id: string) {
  const supabase = await createClient()

  return supabase
    .from("monthly_picks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id,user_id,pan_entry_id,month,year,carried_over_from_month,carried_over_from_year,created_at")
    .single()
}
