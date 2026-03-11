import { type NextRequest, NextResponse } from "next/server"
import { revalidateForWishlistMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { createWishlistItem, listWishlistItems } from "@/lib/services/wishlist"
import { CreateWishlistItemSchema, ListWishlistSchema } from "@/lib/validations/wishlist"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const parsed = ListWishlistSchema.safeParse({
    status: req.nextUrl.searchParams.get("status") ?? "to_buy",
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await listWishlistItems(user.id, parsed.data.status)

  if (error) {
    console.error("GET /api/wishlist error", { userId: user.id, error: error.message })
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

  const parsed = CreateWishlistItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await createWishlistItem(user.id, parsed.data)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: error.message }, { status: 404 })
    }
    console.error("POST /api/wishlist error", { userId: user.id, error: error.message })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  revalidateForWishlistMutation(user.id)

  return NextResponse.json({ data, error: null }, { status: 201 })
}
