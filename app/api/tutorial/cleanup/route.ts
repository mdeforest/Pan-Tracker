import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deleteTutorialData } from "@/lib/services/tutorial"

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { panEntryId: string; productId: string }
  const { panEntryId, productId } = body

  if (!panEntryId || !productId) {
    return NextResponse.json({ data: null, error: "panEntryId and productId are required" }, { status: 400 })
  }

  const { data, error } = await deleteTutorialData(user.id, panEntryId, productId)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
