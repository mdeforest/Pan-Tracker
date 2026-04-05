import { type NextRequest, NextResponse } from "next/server"
import { revalidateForEmptiesMutation, revalidateForProductMutation } from "@/lib/cache/tab-cache"
import { importCollectionRows } from "@/lib/services/import-collection"
import { importCollectionBodySchema } from "@/lib/validations/import-collection"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = importCollectionBodySchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: `Invalid request body: ${message}` }, { status: 400 })
  }

  const summary = await importCollectionRows(user.id, parsed.data.rows)

  if (summary.imported > 0) {
    revalidateForProductMutation(user.id)
    revalidateForEmptiesMutation(user.id)
  }

  return NextResponse.json(summary)
}
