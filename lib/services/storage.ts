import { createAdminClient } from "@/lib/supabase/server-admin"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File must be a JPEG, PNG, or WebP image"
  }
  if (file.size > MAX_BYTES) {
    return "File must be 5 MB or smaller"
  }
  return null
}

export async function uploadProductPhoto(
  file: File,
  userId: string
): Promise<{ data: { url: string } | null; error: string | null }> {
  const admin = createAdminClient()

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const filename = `${userId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await admin.storage
    .from("product-photos")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("uploadProductPhoto: storage upload failed", {
      userId,
      error: uploadError.message,
    })
    return { data: null, error: uploadError.message }
  }

  const { data: urlData } = admin.storage.from("product-photos").getPublicUrl(filename)

  return { data: { url: urlData.publicUrl }, error: null }
}
