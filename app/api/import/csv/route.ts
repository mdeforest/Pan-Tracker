import { type NextRequest, NextResponse } from "next/server"
import { revalidateForEmptiesMutation } from "@/lib/cache/tab-cache"
import { validateImportCsvFileSize } from "@/lib/import/history-csv"
import { importHistoryCsv, previewHistoryCsvImport } from "@/lib/services/import-history"
import { createClient } from "@/lib/supabase/server"

type ImportMode = "preview" | "import"

function getMode(value: string | null): ImportMode | null {
  if (value === "preview" || value === "import") return value
  return null
}

export async function POST(req: NextRequest) {
  const mode = getMode(req.nextUrl.searchParams.get("mode") ?? "import")
  if (!mode) {
    return NextResponse.json({ error: "Invalid mode. Use mode=preview or mode=import." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 })
  }

  const fileSizeError = validateImportCsvFileSize(file.size)
  if (fileSizeError) {
    return NextResponse.json({ error: fileSizeError }, { status: 400 })
  }

  let csvText = ""
  try {
    csvText = await file.text()
  } catch {
    return NextResponse.json({ error: "Unable to read CSV file" }, { status: 400 })
  }

  const summary =
    mode === "preview"
      ? await previewHistoryCsvImport(user.id, csvText)
      : await importHistoryCsv(user.id, csvText)

  if (mode === "import" && summary.imported > 0) {
    revalidateForEmptiesMutation(user.id)
  }

  return NextResponse.json(summary)
}
