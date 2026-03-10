import { type NextRequest, NextResponse } from "next/server"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { addToPan, getPanEntries } from "@/lib/services/pan"
import { AddToPanSchema } from "@/lib/validations/pan"
import { currentYearMonth } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { year, month } = currentYearMonth()
  const status = req.nextUrl.searchParams.get("status")

  const { entriesResult, picksResult } = await getPanEntries(user.id, year, month)

  if (entriesResult.error) {
    console.error("GET /api/pan error", { userId: user.id, error: entriesResult.error.message })
    return NextResponse.json({ data: null, error: entriesResult.error.message }, { status: 500 })
  }

  const pickIds = new Set((picksResult.data ?? []).map((p) => p.pan_entry_id))
  const entries = (entriesResult.data ?? [])
    .map((entry) => ({ ...entry, is_pick: pickIds.has(entry.id) }))
    .filter((entry) => (status ? entry.status === status : true))

  return NextResponse.json({ data: entries, error: null })
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

  const result = AddToPanSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { year, month } = currentYearMonth()
  const { data, error } = await addToPan(user.id, result.data.product_id, year, month)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { data: null, error: "Product is already in your active pan" },
        { status: 409 }
      )
    }
    console.error("POST /api/pan error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  revalidateForPanMutation(user.id, { year, month })

  return NextResponse.json({ data, error: null }, { status: 201 })
}
