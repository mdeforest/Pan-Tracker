import { type NextRequest, NextResponse } from "next/server"
import { revalidateForPanMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { deletePick } from "@/lib/services/picks"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { data, error } = await deletePick(user.id, id)

  if (error) {
    console.error("DELETE /api/picks/[id] error", {
      userId: user.id,
      id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Pick not found" }, { status: 404 })
  }

  revalidateForPanMutation(user.id)

  return NextResponse.json({ data, error: null })
}
