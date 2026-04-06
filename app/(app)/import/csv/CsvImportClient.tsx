"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  UploadCloud, FileType, CheckCircle2, AlertCircle, X, ChevronRight, Info,
  Pencil, ChevronDown, ChevronUp,
} from "lucide-react"
import {
  validateImportCsvFileSize,
  PRODUCT_CATEGORIES,
  WOULD_REPURCHASE_VALUES,
  type ImportCsvError,
  type ParsedHistoryCsvRow,
} from "@/lib/import/history-csv"
import { detectSophiaFormat } from "@/lib/import/collection-csv"
import { ImportCollectionSheet } from "@/components/import/ImportCollectionSheet"
import { useToast } from "@/components/shared/ToastProvider"
import { cn } from "@/lib/utils"

export interface ImportHistorySummary {
  imported: number
  skipped: number
  errors: ImportCsvError[]
  oldestImportedMonth: string | null
  previewRows?: ParsedHistoryCsvRow[]
}

type ImportStatus = "empty" | "current_pan" | "backlog"

interface EditState {
  rowNumber: number
  brand: string
  name: string
  category: string
  status: string
  finished_month: string
  finished_year: string
  rating: string
  would_repurchase: string
  review_notes: string
}

function isErrorResponse(value: unknown): value is { error: string } {
  if (!value || typeof value !== "object") return false
  return "error" in value && typeof (value as { error?: unknown }).error === "string"
}

function buildEditState(rowNumber: number, rawValues?: Record<string, string>): EditState {
  return {
    rowNumber,
    brand: rawValues?.brand ?? "",
    name: rawValues?.name ?? "",
    category: rawValues?.category ?? "",
    status: rawValues?.status ?? "",
    finished_month: rawValues?.finished_month ?? "",
    finished_year: rawValues?.finished_year ?? "",
    rating: rawValues?.rating ?? "",
    would_repurchase: rawValues?.would_repurchase ?? "",
    review_notes: rawValues?.review_notes ?? "",
  }
}

/** Build a minimal 2-row CSV (header + 1 data row) for server-side validation of a single correction. */
function buildMiniCsv(edit: EditState): string {
  const headers = "brand,name,category,status,finished_month,finished_year,rating,would_repurchase,review_notes"
  const quote = (v: string) => `"${v.replace(/"/g, '""')}"`
  const row = [
    quote(edit.brand),
    quote(edit.name),
    quote(edit.category),
    quote(edit.status),
    quote(edit.finished_month),
    quote(edit.finished_year),
    quote(edit.rating),
    quote(edit.would_repurchase),
    quote(edit.review_notes),
  ].join(",")
  return `${headers}\n${row}\n`
}

export function CsvImportClient() {
  const router = useRouter()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportHistorySummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  // Sophia-format detection: when set, hand off to ImportCollectionSheet
  const [collectionFile, setCollectionFile] = useState<File | null>(null)

  // Inline editing state
  const [editingRow, setEditingRow] = useState<EditState | null>(null)
  const [validatingEdit, setValidatingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  // rowNumber → corrected ParsedHistoryCsvRow (replaces the error row)
  const [corrections, setCorrections] = useState<Map<number, ParsedHistoryCsvRow>>(new Map())
  // rowNumbers that have been corrected (used to hide them from errors list)
  const correctedRowNumbers = useMemo(() => new Set(corrections.keys()), [corrections])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayErrors = useMemo(
    () => (preview?.errors ?? []).filter((e) => !correctedRowNumbers.has(e.row)).slice(0, 50),
    [preview, correctedRowNumbers]
  )

  const fatalError = displayErrors.find((e) => e.isFatal)
  const rowErrors = displayErrors.filter((e) => !e.isFatal)
  const isSophiaFormat = fatalError?.rawValues?._sophiaFormat === "true"

  const totalImportCount = (preview?.imported ?? 0) + corrections.size
  const canImport = !!file && !!preview && totalImportCount > 0 && !importing && !loadingPreview

  function reset() {
    setFile(null)
    setFileError(null)
    setPreview(null)
    setLoadingPreview(false)
    setImporting(false)
    setEditingRow(null)
    setEditError(null)
    setCorrections(new Map())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function processFile(nextFile: File | null) {
    setFile(nextFile)
    setFileError(null)
    setPreview(null)
    setCorrections(new Map())
    setEditingRow(null)

    if (!nextFile) return

    const sizeError = validateImportCsvFileSize(nextFile.size)
    if (sizeError) {
      setFileError(sizeError)
      return
    }

    let text: string
    try {
      text = await nextFile.text()
    } catch {
      setFileError("Failed to read file. It might be corrupted or not a valid text file.")
      return
    }

    // Detect format from headers before hitting the server
    const firstLine = text.split(/\r?\n/).find((l) => l.trim())
    const headers = firstLine ? firstLine.split(",").map((h) => h.trim().toLowerCase()) : []
    if (detectSophiaFormat(headers)) {
      // Hand off to the collection import sheet — no server preview needed
      setCollectionFile(nextFile)
      setFile(null)
      return
    }

    await fetchPreview(nextFile)
  }

  async function fetchPreview(fileToPreview: File) {
    setLoadingPreview(true)
    try {
      const formData = new FormData()
      formData.append("file", fileToPreview)

      const res = await fetch("/api/import/csv?mode=preview", {
        method: "POST",
        body: formData,
      })
      const json: unknown = await res.json()

      if (!res.ok || isErrorResponse(json)) {
        setFileError(isErrorResponse(json) ? json.error : "Preview failed")
        return
      }

      setPreview(json as ImportHistorySummary)
    } catch {
      setFileError("Network error while generating preview. Please try again.")
    } finally {
      setLoadingPreview(false)
    }
  }

  function openEditRow(error: ImportCsvError) {
    setEditingRow(buildEditState(error.row, error.rawValues))
    setEditError(null)
  }

  function closeEditRow() {
    setEditingRow(null)
    setEditError(null)
  }

  async function saveEditRow() {
    if (!editingRow) return
    setValidatingEdit(true)
    setEditError(null)

    const miniCsv = buildMiniCsv(editingRow)
    const miniFile = new File([miniCsv], "correction.csv", { type: "text/csv" })
    const formData = new FormData()
    formData.append("file", miniFile)

    try {
      const res = await fetch("/api/import/csv?mode=preview", {
        method: "POST",
        body: formData,
      })
      const json: unknown = await res.json()

      if (!res.ok || isErrorResponse(json)) {
        setEditError(isErrorResponse(json) ? json.error : "Validation failed")
        return
      }

      const result = json as ImportHistorySummary
      if (result.errors.length > 0) {
        setEditError(result.errors.map((e) => e.message).join("; "))
        return
      }

      if (!result.previewRows || result.previewRows.length === 0) {
        // Row was skipped as a dupe — still accept the correction, mark as skipped
        setCorrections((prev) => {
          const next = new Map(prev)
          // Use a sentinel indicating "corrected but skipped"
          next.set(editingRow.rowNumber, {
            row: editingRow.rowNumber,
            brand: editingRow.brand,
            name: editingRow.name,
            category: "miscellaneous",
            status: editingRow.status as ImportStatus || "empty",
            finishedMonth: null,
            finishedYear: null,
            rating: null,
            wouldRepurchase: null,
            reviewNotes: null,
          })
          return next
        })
        setEditingRow(null)
        setEditError(null)
        return
      }

      // Re-stamp with original row number so it maps correctly in import
      const correctedRow: ParsedHistoryCsvRow = {
        ...result.previewRows[0],
        row: editingRow.rowNumber,
      }
      setCorrections((prev) => {
        const next = new Map(prev)
        next.set(editingRow.rowNumber, correctedRow)
        return next
      })
      setEditingRow(null)
    } catch {
      setEditError("Network error. Please try again.")
    } finally {
      setValidatingEdit(false)
    }
  }

  async function handleImport() {
    if (!file) return

    setImporting(true)
    try {
      let res: Response

      if (corrections.size > 0 && preview?.previewRows) {
        // Merge original valid rows + corrections, send as JSON
        const allRows: ParsedHistoryCsvRow[] = [
          ...preview.previewRows,
          ...Array.from(corrections.values()),
        ]
        res = await fetch("/api/import/csv?mode=import-rows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: allRows }),
        })
      } else {
        const formData = new FormData()
        formData.append("file", file)
        res = await fetch("/api/import/csv?mode=import", {
          method: "POST",
          body: formData,
        })
      }

      const json: unknown = await res.json()

      if (!res.ok || isErrorResponse(json)) {
        toast(isErrorResponse(json) ? json.error : "Import failed", "error")
        return
      }

      const summary = json as ImportHistorySummary
      toast(`Imported ${summary.imported} row${summary.imported === 1 ? "" : "s"}.`, "success")

      const destination = summary.oldestImportedMonth
        ? `/empties?import_month=${summary.oldestImportedMonth}`
        : "/empties"

      router.push(destination)
      router.refresh()
    } catch {
      toast("Network error. Please try again.", "error")
    } finally {
      setImporting(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv") {
        await processFile(droppedFile)
      } else {
        setFileError("Please upload a .csv file.")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-12">
      <ImportCollectionSheet
        open={!!collectionFile}
        initialFile={collectionFile}
        onClose={() => { setCollectionFile(null); reset() }}
        onImported={() => { router.push("/products"); router.refresh() }}
      />

      {/* Template Download */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Need the format?</span>
            <span className="text-xs text-muted-foreground">Download our starter template with headers.</span>
          </div>
        </div>
        <a
          href="/templates/history-import-template.csv"
          download
          className="flex h-8 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground active:opacity-80"
        >
          Download CSV
        </a>
      </div>

      {/* Upload Dropzone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-muted/10",
          (loadingPreview || importing) && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => processFile(e.target.files?.[0] ?? null)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Upload CSV file"
        />

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/50">
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        </div>

        <h3 className="mb-1 font-semibold text-foreground">
          Click to upload or drag and drop
        </h3>
        <p className="text-sm text-muted-foreground">
          CSV files only (max 1MB). Up to 500 rows.
        </p>
      </div>

      {/* Active File State */}
      {(file || fileError) && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <FileType className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {file?.name ?? "Unknown file"}
                </p>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={reset}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {fileError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {loadingPreview && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Analyzing file...
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {preview && !loadingPreview && !fileError && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Ready to Import</span>
              <span className="mt-1 text-2xl font-bold text-foreground">{totalImportCount}</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Skipped (Dupes)</span>
              <span className="mt-1 text-2xl font-bold text-muted-foreground">{preview.skipped}</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Errors</span>
              <span className={cn("mt-1 text-2xl font-bold", displayErrors.length > 0 ? "text-destructive" : "text-muted-foreground")}>
                {displayErrors.length}
              </span>
            </div>
          </div>

          {/* Fatal / file-format error */}
          {fatalError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                File Format Error
              </div>
              <p className="text-sm text-destructive/90">{fatalError.message}</p>

              {isSophiaFormat ? (
                <div className="mt-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <span className="font-semibold">This looks like a Sophia-format collection CSV.</span>
                  {" "}Use <span className="font-semibold">Import Collection</span> in the User Menu (avatar, top-right) instead.
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <a
                    href="/templates/history-import-template.csv"
                    download
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground active:opacity-80"
                  >
                    Download template
                  </a>
                  <span className="text-xs text-muted-foreground">to see the required column format.</span>
                </div>
              )}
            </div>
          )}

          {/* Row-level validation errors with inline editing */}
          {rowErrors.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" />
                {rowErrors.length} Row Error{rowErrors.length !== 1 ? "s" : ""} To Fix
              </div>
              <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {rowErrors.map((error, idx) => (
                  <RowErrorItem
                    key={`${error.row}-${idx}`}
                    error={error}
                    isEditing={editingRow?.rowNumber === error.row}
                    editState={editingRow?.rowNumber === error.row ? editingRow : null}
                    editError={editingRow?.rowNumber === error.row ? editError : null}
                    validating={editingRow?.rowNumber === error.row && validatingEdit}
                    onEdit={() => openEditRow(error)}
                    onClose={closeEditRow}
                    onSave={saveEditRow}
                    onFieldChange={(field, value) =>
                      setEditingRow((prev) => prev ? { ...prev, [field]: value } : prev)
                    }
                  />
                ))}
                {preview.errors.length - correctedRowNumbers.size > 50 && (
                  <li className="pt-1 text-xs italic font-medium text-destructive/70">
                    ...and {preview.errors.length - correctedRowNumbers.size - 50} more errors.
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Corrected rows summary */}
          {corrections.size > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                <span className="font-semibold">{corrections.size}</span> row{corrections.size !== 1 ? "s" : ""} corrected and ready to import.
              </p>
            </div>
          )}

          {/* Data preview table */}
          {preview.previewRows && preview.previewRows.length > 0 && (
            <div className="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-4 py-2.5">
                <h4 className="text-sm font-semibold">Data Preview</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-background text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Row</th>
                      <th className="px-4 py-2 font-medium">Brand</th>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Finished</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {preview.previewRows.slice(0, 10).map((row) => (
                      <tr key={row.row} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 text-muted-foreground text-xs">{row.row}</td>
                        <td className="px-4 py-2 font-medium">{row.brand}</td>
                        <td className="px-4 py-2 max-w-[200px] truncate" title={row.name}>{row.name}</td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                            row.status === "empty" && "bg-blue-100 text-blue-700",
                            row.status === "current_pan" && "bg-amber-100 text-amber-700",
                            row.status === "backlog" && "bg-slate-100 text-slate-700"
                          )}>
                            {row.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">
                          {row.finishedMonth && row.finishedYear ? `${row.finishedMonth}/${row.finishedYear}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.previewRows.length > 10 && (
                  <div className="px-4 py-3 text-center text-xs text-muted-foreground border-t border-border/50 bg-muted/10">
                    Showing 10 of {preview.previewRows.length} rows to be imported.
                  </div>
                )}
              </div>

              {displayErrors.length === 0 && (
                <div className="bg-green-50 px-4 py-3 border-t border-border/50 flex items-center gap-2 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  All rows look good and are ready to import!
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-md p-4 pb-safe lg:left-64 xl:left-64 z-10 transition-all">
            <div className="mx-auto max-w-md w-full flex gap-3">
              <button
                type="button"
                onClick={reset}
                disabled={importing}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-white text-sm font-semibold text-foreground active:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!canImport}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {importing ? "Importing..." : `Confirm ${totalImportCount} Import${totalImportCount !== 1 ? "s" : ""}`}
                {!importing && canImport && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bottom spacer for fixed action bar */}
          <div className="h-20" />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline row error editor sub-component
// ---------------------------------------------------------------------------

interface RowErrorItemProps {
  error: ImportCsvError
  isEditing: boolean
  editState: EditState | null
  editError: string | null
  validating: boolean
  onEdit: () => void
  onClose: () => void
  onSave: () => void
  onFieldChange: (field: keyof EditState, value: string) => void
}

function RowErrorItem({
  error, isEditing, editState, editError, validating,
  onEdit, onClose, onSave, onFieldChange,
}: RowErrorItemProps) {
  const hasRawValues = !!error.rawValues && !error.rawValues._sophiaFormat

  return (
    <li className="rounded-lg border border-destructive/15 bg-white overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <span className="font-mono text-xs font-semibold text-destructive/70 min-w-[4ch] pt-0.5">
          #{error.row}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-destructive/90 leading-relaxed">{error.message}</p>
          {hasRawValues && !isEditing && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              {error.rawValues?.brand && (
                <span className="text-[10px] text-muted-foreground">brand: <span className="font-medium text-foreground">{error.rawValues.brand}</span></span>
              )}
              {error.rawValues?.name && (
                <span className="text-[10px] text-muted-foreground">name: <span className="font-medium text-foreground">{error.rawValues.name}</span></span>
              )}
              {error.rawValues?.category && (
                <span className="text-[10px] text-muted-foreground">category: <span className="font-medium text-foreground">{error.rawValues.category}</span></span>
              )}
              {error.rawValues?.status && (
                <span className="text-[10px] text-muted-foreground">status: <span className="font-medium text-foreground">{error.rawValues.status}</span></span>
              )}
            </div>
          )}
        </div>
        {hasRawValues && (
          <button
            type="button"
            onClick={isEditing ? onClose : onEdit}
            className="shrink-0 flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-semibold text-foreground active:bg-muted"
          >
            {isEditing ? (
              <><ChevronUp className="h-3 w-3" /> Close</>
            ) : (
              <><Pencil className="h-3 w-3" /> Fix</>
            )}
          </button>
        )}
      </div>

      {/* Inline edit form */}
      {isEditing && editState && (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="Brand" value={editState.brand} onChange={(v) => onFieldChange("brand", v)} />
            <LabeledInput label="Name" value={editState.name} onChange={(v) => onFieldChange("name", v)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <LabeledSelect
              label="Category"
              value={editState.category}
              onChange={(v) => onFieldChange("category", v)}
              options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c.replace("_", " ") }))}
              placeholder="Select…"
            />
            <LabeledSelect
              label="Status"
              value={editState.status}
              onChange={(v) => onFieldChange("status", v)}
              options={[
                { value: "empty", label: "Empty" },
                { value: "current_pan", label: "Current pan" },
                { value: "backlog", label: "Backlog" },
              ]}
              placeholder="Select…"
            />
          </div>
          {(editState.status === "empty") && (
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Finished month (1–12)" value={editState.finished_month} onChange={(v) => onFieldChange("finished_month", v)} inputMode="numeric" />
              <LabeledInput label="Finished year" value={editState.finished_year} onChange={(v) => onFieldChange("finished_year", v)} inputMode="numeric" />
            </div>
          )}
          {editState.status === "empty" && (
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Rating (1–5, optional)" value={editState.rating} onChange={(v) => onFieldChange("rating", v)} inputMode="numeric" />
              <LabeledSelect
                label="Would repurchase"
                value={editState.would_repurchase}
                onChange={(v) => onFieldChange("would_repurchase", v)}
                options={WOULD_REPURCHASE_VALUES.map((v) => ({ value: v, label: v }))}
                placeholder="Optional"
              />
            </div>
          )}

          {editError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{editError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={validating}
              className="h-9 px-4 rounded-lg border border-border text-xs font-semibold text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={validating}
              className="h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50 flex items-center gap-1.5"
            >
              {validating ? (
                <><div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Checking…</>
              ) : (
                <><CheckCircle2 className="h-3 w-3" /> Save &amp; fix</>
              )}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

function LabeledInput({
  label, value, onChange, inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-white px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}

function LabeledSelect({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-border bg-white px-2.5 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}
