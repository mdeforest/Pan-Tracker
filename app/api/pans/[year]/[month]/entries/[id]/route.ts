import { type NextRequest, NextResponse } from "next/server"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { setPickForEntry } from "@/lib/services/picks"
import { updatePanEntry } from "@/lib/services/pan"
import { UpdatePanEntrySchema } from "@/lib/validations/pan"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string; id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 })
  }

  const { year: yearParam, month: monthParam, id } = await params
  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  const raw =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null
  const hasOnlyIsPick =
    raw !== null &&
    Object.keys(raw).length === 1 &&
    "is_pick" in raw &&
    typeof raw.is_pick === "boolean"

  if (hasOnlyIsPick) {
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ data: null, error: "Invalid year or month" }, { status: 400 })
    }

    const { data, error } = await setPickForEntry(user.id, id, month, year, raw.is_pick as boolean)

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null, error: error.message }, { status: 404 })
      }
      console.error("PATCH /api/pans/[year]/[month]/entries/[id] pick error", {
        userId: user.id,
        id,
        year,
        month,
        error: error.message,
      })
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    revalidateForPanMutation(user.id, { year, month })
    return NextResponse.json({ data, error: null })
  }

  const result = UpdatePanEntrySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await updatePanEntry(user.id, id, result.data)

  if (error) {
    console.error("PATCH /api/pans/[year]/[month]/entries/[id] error", {
      userId: user.id,
      id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Pan entry not found" }, { status: 404 })
  }

  if (!isNaN(year) && !isNaN(month)) {
    revalidateForPanMutation(user.id, { year, month })
  } else {
    revalidateForPanMutation(user.id)
  }

  return NextResponse.json({ data, error: null })
}
