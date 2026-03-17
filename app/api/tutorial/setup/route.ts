import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createTutorialData } from "@/lib/services/tutorial"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as { year: number; month: number }
  const { year, month } = body

  if (!year || !month) {
    return NextResponse.json({ data: null, error: "year and month are required" }, { status: 400 })
  }

  const { data, error } = await createTutorialData(user.id, year, month)

  if (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
