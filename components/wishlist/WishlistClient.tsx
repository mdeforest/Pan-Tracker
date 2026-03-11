"use client"

import { useMemo, useState } from "react"
import { Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { useToast } from "@/components/shared/ToastProvider"
import type { RawWishlistItem, WishlistProductOption } from "@/lib/loaders/tab-data"
import type { WishlistStatus } from "@/lib/types/app"
import { cn } from "@/lib/utils"

interface WishlistClientProps {
  initialItems: RawWishlistItem[]
  productOptions: WishlistProductOption[]
}

interface WishlistItem {
  id: string
  product_id: string | null
  brand: string
  name: string
  notes: string | null
  estimated_price: number | null
  purchased_at: string | null
  created_at: string
}

interface WishlistFormState {
  product_id: string | null
  brand: string
  name: string
  notes: string
  estimated_price: string
}

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const STATUS_OPTIONS: Array<{ value: WishlistStatus; label: string }> = [
  { value: "to_buy", label: "To Buy" },
  { value: "purchased", label: "Purchased" },
  { value: "all", label: "All" },
]

function normalizePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeItem(item: RawWishlistItem): WishlistItem {
  return {
    id: item.id,
    product_id: item.product_id,
    brand: item.brand,
    name: item.name,
    notes: item.notes,
    estimated_price: normalizePrice(item.estimated_price),
    purchased_at: item.purchased_at,
    created_at: item.created_at,
  }
}

function emptyForm(): WishlistFormState {
  return {
    product_id: null,
    brand: "",
    name: "",
    notes: "",
    estimated_price: "",
  }
}

function formatPrice(value: number | null): string {
  if (value === null) return "No estimate"
  return MONEY.format(value)
}

export function WishlistClient({ initialItems, productOptions }: WishlistClientProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<WishlistItem[]>(() => initialItems.map(normalizeItem))
  const [status, setStatus] = useState<WishlistStatus>("to_buy")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [form, setForm] = useState<WishlistFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (status === "to_buy") return !item.purchased_at
      if (status === "purchased") return !!item.purchased_at
      return true
    })
  }, [items, status])

  const toBuyTotal = useMemo(
    () =>
      items
        .filter((item) => !item.purchased_at && item.estimated_price !== null)
        .reduce((sum, item) => sum + (item.estimated_price ?? 0), 0),
    [items]
  )

  const toBuyCount = useMemo(
    () => items.filter((item) => !item.purchased_at).length,
    [items]
  )

  const linkedCount = useMemo(
    () => items.filter((item) => item.product_id !== null).length,
    [items]
  )

  const isEditing = editingItemId !== null

  function resetSheet() {
    setSheetOpen(false)
    setEditingItemId(null)
    setForm(emptyForm())
    setSaving(false)
    setConfirmDeleteId(null)
  }

  function openCreateSheet() {
    setEditingItemId(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEditSheet(item: WishlistItem) {
    setEditingItemId(item.id)
    setForm({
      product_id: item.product_id,
      brand: item.brand,
      name: item.name,
      notes: item.notes ?? "",
      estimated_price: item.estimated_price === null ? "" : String(item.estimated_price),
    })
    setSheetOpen(true)
  }

  function setField<K extends keyof WishlistFormState>(key: K, value: WishlistFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setBusy(id: string, value: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleProductSelected(productId: string) {
    if (!productId) {
      setForm((prev) => ({ ...prev, product_id: null }))
      return
    }

    const selected = productOptions.find((option) => option.id === productId)
    setForm((prev) => ({
      ...prev,
      product_id: productId,
      brand: selected?.brand ?? prev.brand,
      name: selected?.name ?? prev.name,
    }))
  }

  async function handleSave() {
    const brand = form.brand.trim()
    const name = form.name.trim()
    const notes = form.notes.trim()

    if (!brand || !name) {
      toast("Brand and name are required", "error")
      return
    }

    let estimatedPrice: number | null = null
    if (form.estimated_price.trim()) {
      const parsed = Number(form.estimated_price)
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast("Estimated price must be a positive number", "error")
        return
      }
      estimatedPrice = Math.round(parsed * 100) / 100
    }

    const payload = {
      product_id: form.product_id,
      brand,
      name,
      notes: notes ? notes : null,
      estimated_price: estimatedPrice,
    }

    setSaving(true)

    try {
      const url = isEditing ? `/api/wishlist/${editingItemId}` : "/api/wishlist"
      const method = isEditing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data?: RawWishlistItem; error?: unknown }

      if (!res.ok || json.error || !json.data) {
        toast(typeof json.error === "string" ? json.error : "Failed to save wishlist item", "error")
        return
      }

      const nextItem = normalizeItem(json.data)

      if (isEditing) {
        setItems((prev) => prev.map((item) => (item.id === nextItem.id ? nextItem : item)))
        toast("Wishlist item updated", "success")
      } else {
        setItems((prev) => [nextItem, ...prev])
        toast("Wishlist item added", "success")
      }

      resetSheet()
    } catch {
      toast("Network error. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePurchased(item: WishlistItem) {
    const nextPurchased = !item.purchased_at
    setBusy(item.id, true)

    try {
      const res = await fetch(`/api/wishlist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased: nextPurchased }),
      })
      const json = (await res.json()) as { data?: RawWishlistItem; error?: unknown }
      if (!res.ok || json.error || !json.data) {
        toast(typeof json.error === "string" ? json.error : "Failed to update item", "error")
        return
      }

      const nextItem = normalizeItem(json.data)
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? nextItem : entry)))
      toast(nextPurchased ? "Marked as purchased" : "Moved back to to-buy", "success")
    } catch {
      toast("Network error. Please try again.", "error")
    } finally {
      setBusy(item.id, false)
    }
  }

  async function handleDelete(item: WishlistItem) {
    setBusy(item.id, true)
    setConfirmDeleteId(null)

    try {
      const res = await fetch(`/api/wishlist/${item.id}`, { method: "DELETE" })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        toast(typeof json.error === "string" ? json.error : "Failed to delete item", "error")
        return
      }

      setItems((prev) => prev.filter((entry) => entry.id !== item.id))
      toast("Wishlist item deleted", "success")
    } catch {
      toast("Network error. Please try again.", "error")
    } finally {
      setBusy(item.id, false)
    }
  }

  const submitButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
    >
      {saving ? (isEditing ? "Saving..." : "Adding...") : isEditing ? "Save Changes" : "Add to Wishlist"}
    </button>
  )

  return (
    <div className="relative">
      <div className="sticky top-14 z-30 bg-background px-4 pt-3 pb-2">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">To-Buy Estimated Total</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{MONEY.format(toBuyTotal)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {toBuyCount} item{toBuyCount === 1 ? "" : "s"} still on deck · {linkedCount} linked to library
          </p>
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                status === option.value
                  ? "bg-foreground text-background"
                  : "border border-border bg-white text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-28 pt-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-4 py-16 text-center">
            <span className="text-4xl">🛍️</span>
            <p className="mt-3 text-base font-semibold">
              {status === "purchased" ? "Nothing purchased yet" : "Your wishlist is empty"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status === "purchased"
                ? "Mark items as bought when you treat yourself."
                : "Tap + to add something you're eyeing after your next empty."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isBusy = busyIds.has(item.id)
            const isPurchased = !!item.purchased_at

            return (
              <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                    <p className="text-base font-semibold leading-tight">{item.name}</p>
                    {item.product_id && (
                      <span className="mt-2 inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                        Linked product
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      isPurchased
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {isPurchased ? "Purchased" : "To Buy"}
                  </span>
                </div>

                {item.notes && <p className="mt-3 text-sm text-foreground/90">{item.notes}</p>}

                <div className="mt-4 border-t border-border pt-3">
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-red-700">Delete this item?</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-9 items-center justify-center rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={isBusy}
                          className="flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {isBusy ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{formatPrice(item.estimated_price)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePurchased(item)}
                          disabled={isBusy}
                          className={cn(
                            "flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-semibold transition-colors disabled:opacity-50",
                            isPurchased
                              ? "bg-muted text-foreground"
                              : "bg-emerald-600 text-white"
                          )}
                        >
                          {isPurchased ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          {isPurchased ? "Undo" : "Bought"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSheet(item)}
                          disabled={isBusy}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-foreground disabled:opacity-50"
                          aria-label="Edit wishlist item"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={isBusy}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 disabled:opacity-50"
                          aria-label="Delete wishlist item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      <button
        type="button"
        onClick={openCreateSheet}
        aria-label="Add wishlist item"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground shadow-lg active:opacity-80"
      >
        <Plus className="h-6 w-6 text-background" />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={resetSheet}
        title={isEditing ? "Edit Wishlist Item" : "Add Wishlist Item"}
        footer={submitButton}
      >
        <div className="flex flex-col gap-4 p-4">
          <div>
            <label htmlFor="wishlist-product" className="mb-1.5 block text-sm font-semibold">
              Link Existing Product (optional)
            </label>
            <select
              id="wishlist-product"
              value={form.product_id ?? ""}
              onChange={(event) => handleProductSelected(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            >
              <option value="">No linked product</option>
              {productOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.brand} - {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="wishlist-brand" className="mb-1.5 block text-sm font-semibold">
              Brand *
            </label>
            <input
              id="wishlist-brand"
              type="text"
              value={form.brand}
              onChange={(event) => setField("brand", event.target.value)}
              placeholder="e.g. Rare Beauty"
              className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label htmlFor="wishlist-name" className="mb-1.5 block text-sm font-semibold">
              Product Name *
            </label>
            <input
              id="wishlist-name"
              type="text"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="e.g. Soft Pinch Powder Blush"
              className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label htmlFor="wishlist-price" className="mb-1.5 block text-sm font-semibold">
              Estimated Price (optional)
            </label>
            <input
              id="wishlist-price"
              type="number"
              min="0"
              step="0.01"
              value={form.estimated_price}
              onChange={(event) => setField("estimated_price", event.target.value)}
              placeholder="0.00"
              className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label htmlFor="wishlist-notes" className="mb-1.5 block text-sm font-semibold">
              Notes (optional)
            </label>
            <textarea
              id="wishlist-notes"
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Repurchase if on sale, or add shade notes..."
              className="min-h-[90px] w-full resize-none rounded-xl border border-input bg-white px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
