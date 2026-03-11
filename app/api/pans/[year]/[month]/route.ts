import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPanEntries } from "@/lib/services/pan"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { year: yearParam, month: monthParam } = await params
  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ data: null, error: "Invalid year or month" }, { status: 400 })
  }

  const { entriesResult, picksResult } = await getPanEntries(user.id, year, month)

  if (entriesResult.error) {
    console.error("GET /api/pans/[year]/[month] error", {
      userId: user.id,
      error: entriesResult.error.message,
    })
    return NextResponse.json({ data: null, error: entriesResult.error.message }, { status: 500 })
  }

  const pickIds = new Set((picksResult.data ?? []).map((p) => p.pan_entry_id))

  const entries = (entriesResult.data ?? []).map((entry) => ({
    ...entry,
    is_pick: pickIds.has(entry.id),
  }))

  return NextResponse.json({ data: { year, month, entries }, error: null })
}
