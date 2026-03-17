"use client"

import { useMemo, useState } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { validateImportCsvFileSize, type ImportCsvError } from "@/lib/import/history-csv"

export interface ImportHistorySummary {
  imported: number
  skipped: number
  errors: ImportCsvError[]
  oldestImportedMonth: string | null
}

interface ImportHistorySheetProps {
  open: boolean
  onClose: () => void
  onImported: (summary: ImportHistorySummary) => void
  onError: (message: string) => void
}

function isErrorResponse(value: unknown): value is { error: string } {
  if (!value || typeof value !== "object") return false
  return "error" in value && typeof (value as { error?: unknown }).error === "string"
}

export function ImportHistorySheet({
  open,
  onClose,
  onImported,
  onError,
}: ImportHistorySheetProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportHistorySummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [importing, setImporting] = useState(false)

  const canPreview = !!file && !loadingPreview && !importing && !fileError
  const canImport = !!file && !!preview && preview.imported > 0 && !importing && !loadingPreview

  const previewErrors = useMemo(() => (preview?.errors ?? []).slice(0, 6), [preview])

  function reset() {
    setFile(null)
    setFileError(null)
    setPreview(null)
    setLoadingPreview(false)
    setImporting(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFileSelected(nextFile: File | null) {
    setFile(nextFile)
    setFileError(null)
    setPreview(null)

    if (!nextFile) {
      return
    }

    const sizeError = validateImportCsvFileSize(nextFile.size)
    if (sizeError) {
      setFileError(sizeError)
      return
    }

    try {
      await nextFile.text()
    } catch {
      setFileError("Failed to read file")
    }
  }

  async function handlePreview() {
    if (!file) return

    setLoadingPreview(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/import/csv?mode=preview", {
        method: "POST",
        body: formData,
      })
      const json: unknown = await res.json()

      if (!res.ok || isErrorResponse(json)) {
        onError(isErrorResponse(json) ? json.error : "Preview failed")
        return
      }

      setPreview(json as ImportHistorySummary)
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleImport() {
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/import/csv?mode=import", {
        method: "POST",
        body: formData,
      })
      const json: unknown = await res.json()

      if (!res.ok || isErrorResponse(json)) {
        onError(isErrorResponse(json) ? json.error : "Import failed")
        return
      }

      onImported(json as ImportHistorySummary)
      reset()
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Import History"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview}
            className="flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {loadingPreview ? "Previewing..." : "Preview"}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {importing ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">
          Upload a CSV to import products as `empty`, `current_pan`, or `backlog` from the last 36 months.
        </p>

        <a
          href="/templates/history-import-template.csv"
          download
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground active:opacity-80"
        >
          Download CSV Template
        </a>

        <div>
          <label htmlFor="history-csv-file" className="mb-1.5 block text-sm font-semibold">
            CSV file
          </label>
          <input
            id="history-csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => handleFileSelected(event.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium"
          />
          {file && <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p>}
          {fileError && <p className="mt-1 text-xs text-destructive">{fileError}</p>}
        </div>

        {preview && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Preview summary</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ready to import: {preview.imported} · Skipped: {preview.skipped} · Errors:{" "}
              {preview.errors.length}
            </p>
            {previewErrors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {previewErrors.map((error, idx) => (
                  <li key={`${error.row}-${idx}`} className="text-xs text-destructive">
                    Row {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
