"use client"

import { useState } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { cn } from "@/lib/utils"
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

interface NewProductSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (productId: string) => void
  onError: (msg: string) => void
}

export function NewProductSheet({ open, onClose, onCreated, onError }: NewProductSheetProps) {
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("")
  const [category, setCategory] = useState<ProductCategory>("skincare")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  function reset() {
    setName("")
    setBrand("")
    setCategory("skincare")
    setPhotoFile(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleCreate() {
    if (!name.trim() || !brand.trim()) {
      onError("Name and brand are required")
      return
    }
    setCreating(true)
    try {
      const createRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brand: brand.trim(), category }),
      })
      const createJson = (await createRes.json()) as { data?: { id: string }; error?: unknown }
      if (!createRes.ok || createJson.error || !createJson.data) {
        onError(typeof createJson.error === "string" ? createJson.error : "Failed to create product")
        return
      }
      const productId = createJson.data.id

      // Upload photo (non-fatal)
      if (photoFile) {
        try {
          const fd = new FormData()
          fd.append("file", photoFile)
          const photoRes = await fetch("/api/upload/product-photo", { method: "POST", body: fd })
          const photoJson = (await photoRes.json()) as { data?: { url?: string } }
          if (photoRes.ok && photoJson.data?.url) {
            await fetch(`/api/products/${productId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photo_url: photoJson.data.url }),
            })
          }
        } catch {
          // non-fatal
        }
      }

      reset()
      onCreated(productId)
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const submitButton = (
    <button
      onClick={handleCreate}
      disabled={creating || !name.trim() || !brand.trim()}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
    >
      {creating ? "Creating…" : "Create Product"}
    </button>
  )

  return (
    <BottomSheet open={open} onClose={handleClose} title="New Product" footer={submitButton}>
      <div className="flex flex-col gap-4 p-4">
        {/* Name */}
        <div>
          <label htmlFor="np-name" className="mb-1.5 block text-sm font-semibold">
            Product Name *
          </label>
          <input
            id="np-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Soft Pinch Liquid Blush"
            className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="np-brand" className="mb-1.5 block text-sm font-semibold">
            Brand *
          </label>
          <input
            id="np-brand"
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Rare Beauty"
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

        {/* Photo */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Photo (optional)</label>
          <label
            htmlFor="np-photo"
            className={cn(
              "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 text-sm",
              photoFile
                ? "border-foreground text-foreground"
                : "border-muted-foreground/40 text-muted-foreground"
            )}
          >
            {photoFile ? photoFile.name : "Choose photo…"}
            <input
              id="np-photo"
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
