import { type NextRequest, NextResponse } from "next/server"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { addToPan } from "@/lib/services/pan"
import { AddToPanSchema } from "@/lib/validations/pan"

export async function POST(
  req: NextRequest,
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

  const { data, error } = await addToPan(user.id, result.data.product_id, year, month)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
    }
    // Postgres unique constraint violation code
    if (error.code === "23505") {
      return NextResponse.json(
        { data: null, error: "Product is already in your active pan" },
        { status: 409 }
      )
    }
    console.error("POST /api/pans/[year]/[month]/entries error", {
      userId: user.id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  revalidateForPanMutation(user.id, { year, month })

  return NextResponse.json({ data, error: null }, { status: 201 })
}
