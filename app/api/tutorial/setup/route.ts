import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createProduct } from "@/lib/services/products"
import { currentYearMonth } from "@/lib/utils"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  // Check if a tutorial sample already exists to avoid duplicates
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Tutorial Sample Product")
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ data: existing.id, error: null })
  }

  // Create the sample product
  const { data: product, error: productError } = await createProduct(user.id, {
    brand: "PanTracker",
    name: "Tutorial Sample Product",
    category: "moisturizer",
    notes: "This is a temporary product created for the tutorial tour.",
  })

  if (productError || !product) {
    console.error("Failed to create tutorial sample product:", productError)
    return NextResponse.json({ data: null, error: "Failed to create sample product" }, { status: 500 })
  }

  // Add it to the active pan for the current month
  const { year, month } = currentYearMonth()
  const { error: panError } = await supabase.from("pan_entries").insert({
    user_id: user.id,
    product_id: product.id,
    started_year: year,
    started_month: month,
    status: "active",
    usage_level: "just_started",
  })

  if (panError) {
    console.error("Failed to add sample product to pan:", panError)
    return NextResponse.json({ data: null, error: "Failed to add sample to pan" }, { status: 500 })
  }

  return NextResponse.json({ data: product.id, error: null })
}
