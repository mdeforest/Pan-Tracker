import { type NextRequest, NextResponse } from "next/server"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { carryOverEntries } from "@/lib/services/pan"
import { CarryOverSchema } from "@/lib/validations/pan"

export async function POST(
  req: NextRequest,
  { params }: { params: { year: string; month: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const year = parseInt(params.year, 10)
  const month = parseInt(params.month, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ data: null, error: "Invalid year or month" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: "Invalid JSON" }, { status: 400 })
  }

  const result = CarryOverSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await carryOverEntries(user.id, result.data.product_ids, year, month)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { data: null, error: "One or more products were not found" },
        { status: 404 }
      )
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { data: null, error: "One or more products are already in your active pan" },
        { status: 409 }
      )
    }
    console.error("POST /api/pans/[year]/[month]/carry-over error", {
      userId: user.id,
      error,
    })
    return NextResponse.json({ data: null, error: "Carry-over failed" }, { status: 500 })
  }

  revalidateForPanMutation(user.id, { year, month })

  return NextResponse.json({ data, error: null }, { status: 201 })
}
