import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  let db: "ok" | "error" = "error"

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("products").select("id").limit(1)
    if (!error) db = "ok"
  } catch {
    // db stays "error"
  }

  return NextResponse.json({ status: "ok", db, ts: new Date().toISOString() })
}
