import { type NextRequest, NextResponse } from "next/server"
import { revalidateForEmptiesMutation } from "@/lib/cache/tab-cache"
import { validateImportCsvFileSize, type ParsedHistoryCsvRow } from "@/lib/import/history-csv"
import { importHistoryCsv, importParsedRows, previewHistoryCsvImport } from "@/lib/services/import-history"
import { createClient } from "@/lib/supabase/server"

type ImportMode = "preview" | "import" | "import-rows"

function getMode(value: string | null): ImportMode | null {
  if (value === "preview" || value === "import" || value === "import-rows") return value
  return null
}

export async function POST(req: NextRequest) {
  const mode = getMode(req.nextUrl.searchParams.get("mode") ?? "import")
  if (!mode) {
    return NextResponse.json({ error: "Invalid mode. Use mode=preview, mode=import, or mode=import-rows." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // mode=import-rows: accept pre-validated rows as JSON (used when client has inline corrections)
  if (mode === "import-rows") {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    if (!body || !Array.isArray((body as { rows?: unknown }).rows)) {
      return NextResponse.json({ error: "Body must be { rows: ParsedHistoryCsvRow[] }" }, { status: 400 })
    }
    const rows = (body as { rows: ParsedHistoryCsvRow[] }).rows
    const summary = await importParsedRows(user.id, rows)
    if (summary.imported > 0) {
      revalidateForEmptiesMutation(user.id)
    }
    return NextResponse.json(summary)
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
