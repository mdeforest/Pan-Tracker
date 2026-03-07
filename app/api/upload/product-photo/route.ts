import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadProductPhoto, validatePhotoFile } from "@/lib/services/storage"

export async function POST(req: NextRequest) {
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

  const { data, error } = await uploadProductPhoto(file, user.id)

  if (error) {
    return NextResponse.json({ data: null, error }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
