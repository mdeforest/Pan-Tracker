"use client"

import Image from "next/image"
import { CATEGORY_EMOJI } from "@/components/pan/utils"
import type { ExpiringSoonProduct } from "@/lib/loaders/tab-data"
import type { ProductCategory } from "@/lib/types/app"

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

interface ExpiringSoonShelfProps {
  products: ExpiringSoonProduct[]
  onAddToPan: (productId: string) => Promise<void>
  addingId: string | null
}

export function ExpiringSoonShelf({
  products,
  onAddToPan,
  addingId,
}: ExpiringSoonShelfProps) {
  if (products.length === 0) return null

  return (
    <section className="px-4 pt-2 pb-0">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Expiring Soon</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {products.map((product) => {
          const expiry = new Date(product.expiration_date + "T00:00:00")
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const daysLeft = Math.round(
            (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          const isExpired = daysLeft <= 0
          const isUrgent = daysLeft <= 30

          return (
            <div
              key={product.id}
              className="flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gray-100 shadow-sm"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                {product.photo_url ? (
                  <Image
                    src={product.photo_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <span className="text-3xl opacity-60">
                      {CATEGORY_EMOJI[product.category as ProductCategory]}
                    </span>
                  </div>
                )}
                <span
                  className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isExpired || isUrgent
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isExpired
                    ? "Expired"
                    : isUrgent
                      ? `${daysLeft}d left`
                      : DATE_FMT.format(expiry)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-2">
                <p className="line-clamp-2 text-[11px] font-bold uppercase tracking-wide leading-tight text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {product.brand || "—"}
                </p>
                <button
                  type="button"
                  onClick={() => onAddToPan(product.id)}
                  disabled={addingId === product.id}
                  className="mt-0.5 flex h-8 w-full items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {addingId === product.id ? "Adding…" : "Add to Pan"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
