"use client"

import { useState, useEffect } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { cn } from "@/lib/utils"
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

interface ProductEditSheetProps {
  open: boolean
  productId: string
  initialName: string
  initialBrand: string
  initialCategory: ProductCategory
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function ProductEditSheet({
  open,
  productId,
  initialName,
  initialBrand,
  initialCategory,
  onClose,
  onSaved,
  onError,
}: ProductEditSheetProps) {
  const [name, setName] = useState(initialName)
  const [brand, setBrand] = useState(initialBrand)
  const [category, setCategory] = useState<ProductCategory>(initialCategory)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync if product changes externally
  useEffect(() => {
    if (open) {
      setName(initialName)
      setBrand(initialBrand)
      setCategory(initialCategory)
      setPhotoFile(null)
    }
  }, [open, initialName, initialBrand, initialCategory])

  async function handleSave() {
    if (!name.trim() || !brand.trim()) {
      onError("Name and brand are required")
      return
    }
    setSaving(true)
    try {
      // Upload photo first if changed (non-fatal)
      let photoUrl: string | undefined
      if (photoFile) {
        try {
          const fd = new FormData()
          fd.append("file", photoFile)
          const photoRes = await fetch("/api/upload/product-photo", { method: "POST", body: fd })
          const photoJson = (await photoRes.json()) as { data?: { url?: string } }
          if (photoRes.ok && photoJson.data?.url) {
            photoUrl = photoJson.data.url
          }
        } catch {
          // non-fatal
        }
      }

      const patch: Record<string, unknown> = {
        name: name.trim(),
        brand: brand.trim(),
        category,
      }
      if (photoUrl) patch.photo_url = photoUrl

      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to save changes")
        return
      }
      onSaved()
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const submitButton = (
    <button
      onClick={handleSave}
      disabled={saving || !name.trim() || !brand.trim()}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
    >
      {saving ? "Saving…" : "Save Changes"}
    </button>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Product" footer={submitButton}>
      <div className="flex flex-col gap-4 p-4">
        {/* Name */}
        <div>
          <label htmlFor="ep-name" className="mb-1.5 block text-sm font-semibold">
            Product Name *
          </label>
          <input
            id="ep-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="ep-brand" className="mb-1.5 block text-sm font-semibold">
            Brand *
          </label>
          <input
            id="ep-brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Category */}
        <div>
          <p className="mb-2 text-sm font-semibold">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs transition-colors",
                  category === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-white text-foreground"
                )}
              >
                <span className="text-lg">{CATEGORY_EMOJI[cat]}</span>
                <span className="text-center leading-tight">{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Replace photo */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Replace Photo (optional)</label>
          <label
            htmlFor="ep-photo"
            className={cn(
              "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 text-sm",
              photoFile
                ? "border-foreground text-foreground"
                : "border-muted-foreground/40 text-muted-foreground"
            )}
          >
            {photoFile ? photoFile.name : "Choose new photo…"}
            <input
              id="ep-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

      </div>
    </BottomSheet>
  )
}
