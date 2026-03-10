import { type NextRequest, NextResponse } from "next/server"
import { revalidateForProductMutation } from "@/lib/cache/tab-cache"
import { createClient } from "@/lib/supabase/server"
import { updateProduct, archiveProduct, restoreProduct } from "@/lib/services/products"
import { RestoreProductSchema, UpdateProductSchema } from "@/lib/validations/products"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const restoreResult = RestoreProductSchema.safeParse(body)
  if (restoreResult.success) {
    const { data, error } = await restoreProduct(user.id, params.id)

    if (error) {
      console.error("PATCH /api/products/[id] restore error", {
        userId: user.id,
        id: params.id,
        error: error.message,
      })
      return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
    }

    revalidateForProductMutation(user.id)

    return NextResponse.json({ data, error: null })
  }

  const updateResult = UpdateProductSchema.safeParse(body)
  if (!updateResult.success) {
    return NextResponse.json(
      { data: null, error: updateResult.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { data, error } = await updateProduct(user.id, params.id, updateResult.data)

  if (error) {
    console.error("PATCH /api/products/[id] error", {
      userId: user.id,
      id: params.id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
  }

  revalidateForProductMutation(user.id)

  return NextResponse.json({ data, error: null })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await archiveProduct(user.id, params.id)

  if (error) {
    console.error("DELETE /api/products/[id] error", {
      userId: user.id,
      id: params.id,
      error: error.message,
    })
    if (error.code === "PRODUCT_IN_ACTIVE_PAN") {
      return NextResponse.json({ data: null, error: error.message }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
  }

  revalidateForProductMutation(user.id)

  return NextResponse.json({ data, error: null })
}
