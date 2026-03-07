import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updatePanEntry } from "@/lib/services/pan"
import { UpdatePanEntrySchema } from "@/lib/validations/pan"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { year: string; month: string; id: string } }
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

  const result = UpdatePanEntrySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await updatePanEntry(user.id, params.id, result.data)

  if (error) {
    console.error("PATCH /api/pans/[year]/[month]/entries/[id] error", {
      userId: user.id,
      id: params.id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Pan entry not found" }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}
