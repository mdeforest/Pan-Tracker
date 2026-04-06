"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import {
  detectCategoryFromFilename,
  parseCollectionCsv,
  type ParsedCollectionRow,
  type ParsedWishlistRow,
} from "@/lib/import/collection-csv"
import { ExpiryBadge } from "@/components/products/ExpiryBadge"
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

interface ReviewRowState {
  index: number
  productString: string
  brand: string
  name: string
  skipped: boolean
}

interface ImportCollectionSheetProps {
  open: boolean
  onClose: () => void
  onImported: () => void
  /** When provided, skip the file picker and parse this file immediately on open */
  initialFile?: File | null
}

type Step = "file" | "review" | "preview" | "done"

export function ImportCollectionSheet({
  open,
  onClose,
  onImported,
  initialFile,
}: ImportCollectionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("file")
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<ProductCategory>("miscellaneous")

  // When an initialFile is injected (e.g. from the unified import page), pre-load
  // the file and auto-detect the category — but leave the user on the file step
  // so they can confirm/change the category before parsing.
  useEffect(() => {
    if (open && initialFile && step === "file") {
      const detected = detectCategoryFromFilename(initialFile.name)
      setFile(initialFile)
      if (detected) setCategory(detected)
    }
    // Only re-run when the sheet opens with a new initialFile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile])
  const [parseResult, setParseResult] = useState<ReturnType<
    typeof parseCollectionCsv
  > | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRowState[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    imported: number
    skipped: number
    wishlistImported: number
    wishlistSkipped: number
    errors: string[]
  } | null>(null)

  function handleClose() {
    setStep("file")
    setFile(null)
    setCategory("miscellaneous")
    setParseResult(null)
    setReviewRows([])
    setError(null)
    setSummary(null)
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setError(null)

    if (selected) {
      const detected = detectCategoryFromFilename(selected.name)
      if (detected) setCategory(detected)
    }
  }

  async function handleParseFile(target: File, cat: ProductCategory) {
    setLoading(true)
    setError(null)

    let text: string
    try {
      text = await target.text()
    } catch {
      setError("Could not read the file. Please try again.")
      setLoading(false)
      return
    }

    const result = parseCollectionCsv(text, cat)

    if (result.errors.length > 0) {
      setError(result.errors[0])
      setLoading(false)
      return
    }

    if (result.rows.length === 0 && result.wishlistRows.length === 0) {
      setError("No product or wishlist rows found in this file.")
      setLoading(false)
      return
    }

    setParseResult(result)

    const unmatched = result.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !row.autoMatched)
      .map(({ row, index }) => ({
        index,
        productString: row.productString,
        brand: "",
        name: row.name,
        skipped: false,
      }))

    if (unmatched.length > 0) {
      setReviewRows(unmatched)
      setStep("review")
    } else {
      setStep("preview")
    }

    setLoading(false)
  }

  async function handleParse() {
    if (!file) return
    await handleParseFile(file, category)
  }

  function updateReviewRow(
    index: number,
    field: "brand" | "name" | "skipped",
    value: string | boolean
  ) {
    setReviewRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, [field]: value } : r))
    )
  }

  function skipAllUnreviewed() {
    setReviewRows((prev) => prev.map((r) => ({ ...r, skipped: true })))
    setStep("preview")
  }

  function proceedFromReview() {
    setStep("preview")
  }

  function buildFinalRows(): ParsedCollectionRow[] {
    if (!parseResult) return []

    const reviewByIndex = new Map(reviewRows.map((r) => [r.index, r]))

    return parseResult.rows
      .map((row, index) => {
        if (row.autoMatched) return row

        const reviewed = reviewByIndex.get(index)
        if (!reviewed) {
          // Unreviewed unmatched row — import as-is with blank brand
          return { ...row, brand: "", name: row.productString }
        }
        if (reviewed.skipped) {
          return null
        }
        return {
          ...row,
          brand: reviewed.brand.trim(),
          name: reviewed.name.trim() || row.productString,
        }
      })
      .filter((row): row is ParsedCollectionRow => row !== null && row.name.trim().length > 0)
  }

  const finalRows = useMemo(
    () => (step === "preview" || step === "done" ? buildFinalRows() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parseResult, reviewRows, step]
  )

  function buildFinalWishlistRows(): ParsedWishlistRow[] {
    if (!parseResult) return []
    return parseResult.wishlistRows
  }

  async function handleImport() {
    setLoading(true)
    setError(null)

    const rows = finalRows
    const wishlistRows = buildFinalWishlistRows().map((r) => ({
      brand: r.brand,
      name: r.name,
    }))

    const res = await fetch("/api/import/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, wishlistRows }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Import failed")
      setLoading(false)
      return
    }

    setSummary(data)
    setStep("done")
    setLoading(false)
    onImported()
  }

  const finishedCount = parseResult?.rows.filter((r) => r.isFinished).length ?? 0
  const totalRows = parseResult?.rows.length ?? 0
  const notYetPannedCount = totalRows - finishedCount
  const wishlistCount = parseResult?.wishlistRows.length ?? 0

  return (
    <BottomSheet open={open} onClose={handleClose} title="Import Collection">
      {/* Step 1: File + Category */}
      {step === "file" && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Upload one of Sophia&apos;s per-category CSV files. Category is
            auto-detected from the filename.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">CSV File</label>
            {file && initialFile ? (
              /* File was injected from the unified import page — show name, no picker */
              <p className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground truncate">
                {file.name}
              </p>
            ) : (
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            )}
            {file && !initialFile && (
              <p className="text-[12px] text-muted-foreground">{file.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleParse}
            disabled={!file || loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Parsing…" : "Next"}
          </button>
        </div>
      )}

      {/* Step 2: Brand/Name Review */}
      {step === "review" && parseResult && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <div>
            <p className="text-sm font-medium">
              {parseResult.autoMatchedCount} products auto-matched
            </p>
            <p className="text-sm text-muted-foreground">
              {reviewRows.length} product
              {reviewRows.length !== 1 ? "s" : ""} need brand/name review.
            </p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh]">
            {reviewRows.map((r) => (
              <div
                key={r.index}
                className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {r.productString}
                </p>
                {!r.skipped && (
                  <>
                    <input
                      type="text"
                      placeholder="Brand (optional)"
                      value={r.brand}
                      onChange={(e) =>
                        updateReviewRow(r.index, "brand", e.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Product name"
                      value={r.name}
                      onChange={(e) =>
                        updateReviewRow(r.index, "name", e.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() =>
                    updateReviewRow(r.index, "skipped", !r.skipped)
                  }
                  className="self-start text-xs text-muted-foreground underline py-2 px-1"
                >
                  {r.skipped ? "Undo skip" : "Skip (import as-is)"}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={skipAllUnreviewed}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium"
            >
              Skip all
            </button>
            <button
              type="button"
              onClick={proceedFromReview}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview + Confirm */}
      {step === "preview" && parseResult && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          {/* Summary counts */}
          <div className="rounded-xl bg-muted px-4 py-3 flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-semibold">{notYetPannedCount}</span> products to add to library
            </p>
            {finishedCount > 0 && (
              <p className="text-sm">
                <span className="font-semibold">{finishedCount}</span> marked as finished — will create empty records
              </p>
            )}
            {wishlistCount > 0 && (
              <p className="text-sm">
                <span className="font-semibold">{wishlistCount}</span> wants to add to wishlist
              </p>
            )}
          </div>

          {/* Product rows */}
          {finalRows.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Products</p>
              <div className="overflow-y-auto max-h-[28vh] flex flex-col gap-2">
                {finalRows.map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {row.brand || "No brand"}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <ExpiryBadge expirationDate={row.expirationDate ?? null} alwaysShow />
                      {row.isFinished && (
                        <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                          Finished
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wishlist rows */}
          {wishlistCount > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Wants → Wishlist</p>
              <div className="overflow-y-auto max-h-[20vh] flex flex-col gap-2">
                {buildFinalWishlistRows().map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{row.name}</p>
                      {row.brand && (
                        <p className="text-[12px] text-muted-foreground truncate">{row.brand}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Importing…" : `Import ${finalRows.length + wishlistCount} items`}
          </button>
        </div>
      )}

      {/* Done */}
      {step === "done" && summary && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <div className="rounded-xl bg-muted px-4 py-3 flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              Import complete
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.imported} product{summary.imported !== 1 ? "s" : ""} imported · {summary.skipped} skipped
            </p>
            {summary.wishlistImported > 0 && (
              <p className="text-sm text-muted-foreground">
                {summary.wishlistImported} wishlist item{summary.wishlistImported !== 1 ? "s" : ""} added
                {summary.wishlistSkipped > 0 ? ` · ${summary.wishlistSkipped} already on wishlist` : ""}
              </p>
            )}
          </div>

          {summary.errors.length > 0 && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive mb-1">
                {summary.errors.length} error
                {summary.errors.length !== 1 ? "s" : ""}
              </p>
              <ul className="list-disc list-inside text-sm text-destructive space-y-0.5">
                {summary.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
