import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listEmpties, createEmpty } from "@/lib/services/empties"
import { CreateEmptySchema } from "@/lib/validations/empties"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")
  const year = yearParam ? parseInt(yearParam, 10) : undefined
  const month = monthParam ? parseInt(monthParam, 10) : undefined
  const category = searchParams.get("category") ?? undefined

  const { data, error } = await listEmpties(user.id, { year, month, category })

  if (error) {
    console.error("GET /api/empties error", { userId: user.id, error: error.message })
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

  const result = CreateEmptySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const now = new Date()

  const { data, error } = await createEmpty(user.id, {
    pan_entry_id: result.data.pan_entry_id,
    finished_month: now.getMonth() + 1,
    finished_year: now.getFullYear(),
    rating: result.data.rating,
    would_repurchase: result.data.would_repurchase,
    review_notes: result.data.review_notes,
    replacement_product_id: result.data.replacement_product_id,
    replacement_free_text: result.data.replacement_free_text,
  })

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: error.message }, { status: 404 })
    }
    console.error("POST /api/empties error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
