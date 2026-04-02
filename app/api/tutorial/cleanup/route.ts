import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  // Find the tutorial sample
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Tutorial Sample Product")
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ data: null, error: null }) // Nothing to clean up
  }

  // Delete pan entries first (foreign key constraint)
  await supabase
    .from("pan_entries")
    .delete()
    .eq("product_id", existing.id)

  // Hard delete the tutorial product
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", existing.id)

  if (error) {
    console.error("Failed to cleanup tutorial sample product:", error)
    return NextResponse.json({ data: null, error: "Failed to cleanup sample" }, { status: 500 })
  }

  return NextResponse.json({ data: "success", error: null })
}
