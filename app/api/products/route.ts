import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { listProducts, createProduct } from "@/lib/services/products"
import { CreateProductSchema } from "@/lib/validations/products"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const q = searchParams.get("q") ?? undefined
  const category = searchParams.get("category") ?? undefined
  const includeArchived = searchParams.get("include_archived") === "true"

  const { data, error } = await listProducts(user.id, q, category, includeArchived)

  if (error) {
    console.error("GET /api/products error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null })
}

export async function POST(req: NextRequest) {
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

  const result = CreateProductSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await createProduct(user.id, result.data)

  if (error) {
    console.error("POST /api/products error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
