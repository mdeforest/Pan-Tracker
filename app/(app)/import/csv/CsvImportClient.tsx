"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, FileType, CheckCircle2, AlertCircle, X, ChevronRight, Info } from "lucide-react"
import { validateImportCsvFileSize, type ImportCsvError, type ParsedHistoryCsvRow } from "@/lib/import/history-csv"
import { useToast } from "@/components/shared/ToastProvider"
import { cn } from "@/lib/utils"

export interface ImportHistorySummary {
  imported: number
  skipped: number
  errors: ImportCsvError[]
  oldestImportedMonth: string | null
  previewRows?: ParsedHistoryCsvRow[]
}

function isErrorResponse(value: unknown): value is { error: string } {
  if (!value || typeof value !== "object") return false
  return "error" in value && typeof (value as { error?: unknown }).error === "string"
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canImport = !!file && !!preview && preview.imported > 0 && !importing && !loadingPreview

  // Only show first 50 errors to prevent massive UI rendering on very bad files
  const displayErrors = useMemo(() => (preview?.errors ?? []).slice(0, 50), [preview])

  function reset() {
    setFile(null)
    setFileError(null)
    setPreview(null)
    setLoadingPreview(false)
    setImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function processFile(nextFile: File | null) {
    setFile(nextFile)
    setFileError(null)
    setPreview(null)

    if (!nextFile) return

    const sizeError = validateImportCsvFileSize(nextFile.size)
    if (sizeError) {
      setFileError(sizeError)
      return
    }

    try {
      await nextFile.text()
    } catch {
      setFileError("Failed to read file. It might be corrupted or not a valid text file.")
      return
    }

    // Auto-preview
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
              <span className="mt-1 text-2xl font-bold text-foreground">{preview.imported}</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Skipped (Dupes)</span>
              <span className="mt-1 text-2xl font-bold text-muted-foreground">{preview.skipped}</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">Errors</span>
              <span className={cn("mt-1 text-2xl font-bold", preview.errors.length > 0 ? "text-destructive" : "text-muted-foreground")}>
                {preview.errors.length}
              </span>
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" />
                Row Errors To Fix
              </div>
              <ul className="space-y-1.5 text-xs text-destructive/90 max-h-48 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
                {displayErrors.map((error, idx) => (
                  <li key={`${error.row}-${idx}`} className="flex items-start gap-2 border-b border-destructive/10 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-mono font-medium min-w-[3ch]">#{error.row}</span>
                    <span>{error.message}</span>
                  </li>
                ))}
                {preview.errors.length > 50 && (
                   <li className="pt-1 italic font-medium">...and {preview.errors.length - 50} more errors.</li>
                )}
              </ul>
            </div>
          )}

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
               
               {preview.errors.length === 0 && (
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
                  {importing ? "Importing..." : `Confirm ${preview.imported} Imports`}
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
