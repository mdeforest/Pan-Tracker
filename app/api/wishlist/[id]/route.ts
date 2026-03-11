import { type NextRequest, NextResponse } from "next/server"
import { revalidateForProductMutation, revalidateForWishlistMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { buyWishlistItem, deleteWishlistItem, updateWishlistItem } from "@/lib/services/wishlist"
import { UpdateWishlistItemSchema } from "@/lib/validations/wishlist"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = UpdateWishlistItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { id } = await params

  // "Bought" action — delete wishlist item and update/create product
  if (parsed.data.purchased === true) {
    const { data, error } = await buyWishlistItem(user.id, id)
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null, error: error.message }, { status: 404 })
      }
      console.error("PATCH /api/wishlist/[id] buy error", { userId: user.id, id, error: error.message })
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }
    revalidateForWishlistMutation(user.id)
    revalidateForProductMutation(user.id)
    return NextResponse.json({ data, error: null })
  }

  const { data, error } = await updateWishlistItem(user.id, id, parsed.data)

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ data: null, error: error.message }, { status: 404 })
    }
    console.error("PATCH /api/wishlist/[id] error", {
      userId: user.id,
      id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Wishlist item not found" }, { status: 404 })
  }

  revalidateForWishlistMutation(user.id)

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { data, error } = await deleteWishlistItem(user.id, id)

  if (error) {
    console.error("DELETE /api/wishlist/[id] error", {
      userId: user.id,
      id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Wishlist item not found" }, { status: 404 })
  }

  revalidateForWishlistMutation(user.id)

  return NextResponse.json({ data, error: null })
}
