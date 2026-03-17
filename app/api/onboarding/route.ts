import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeOnboarding } from "@/lib/services/onboarding"

export async function PATCH() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await completeOnboarding(user.id)

  if (error) {
    console.error("PATCH /api/onboarding error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}
