import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deletePick } from "@/lib/services/picks"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await deletePick(user.id, params.id)

  if (error) {
    console.error("DELETE /api/picks/[id] error", {
      userId: user.id,
      id: params.id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Pick not found" }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}
