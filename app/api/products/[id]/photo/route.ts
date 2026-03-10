import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateProduct } from "@/lib/services/products"
import { uploadProductPhoto, validatePhotoFile } from "@/lib/services/storage"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ data: null, error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ data: null, error: "Missing file field" }, { status: 400 })
  }

  const validationError = validatePhotoFile(file)
  if (validationError) {
    return NextResponse.json({ data: null, error: validationError }, { status: 400 })
  }

  const uploadResult = await uploadProductPhoto(file, user.id)
  if (uploadResult.error || !uploadResult.data?.url) {
    return NextResponse.json(
      { data: null, error: uploadResult.error ?? "Photo upload failed" },
      { status: 500 }
    )
  }

  const { data, error } = await updateProduct(user.id, params.id, {
    photo_url: uploadResult.data.url,
  })

  if (error) {
    console.error("POST /api/products/[id]/photo error", {
      userId: user.id,
      id: params.id,
      error: error.message,
    })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null, error: "Product not found" }, { status: 404 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
