import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listPicks, setPicks } from "@/lib/services/picks"
import { ListPicksSchema, SetPicksSchema } from "@/lib/validations/picks"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const parsed = ListPicksSchema.safeParse({
    month: req.nextUrl.searchParams.get("month"),
    year: req.nextUrl.searchParams.get("year"),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await listPicks(user.id, parsed.data.month, parsed.data.year)

  if (error) {
    console.error("GET /api/picks error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function POST(req: NextRequest) {
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

  const parsed = SetPicksSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  if (parsed.data.pan_entry_ids.length > 10) {
    return NextResponse.json(
      { data: null, error: "A maximum of 10 picks is allowed" },
      { status: 422 }
    )
  }

  const { data, error } = await setPicks(
    user.id,
    parsed.data.pan_entry_ids,
    parsed.data.month,
    parsed.data.year
  )

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: error.message }, { status: 404 })
    }
    console.error("POST /api/picks error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
