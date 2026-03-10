import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  CATEGORY_EMOJI,
  CATEGORY_BG,
} from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

export interface ProductCardData {
  id: string
  name: string
  brand: string
  category: ProductCategory
  photo_url: string | null
  is_in_pan: boolean
  is_archived: boolean
}

interface ProductCardProps {
  product: ProductCardData
  onRestore?: (productId: string) => void
  restoring?: boolean
}

export function ProductCard({ product, onRestore, restoring = false }: ProductCardProps) {
  const cat = product.category

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-sm",
        product.is_archived && "ring-1 ring-amber-200"
      )}
    >
      <Link
        href={`/products/${product.id}`}
        className={cn("flex min-h-[160px] flex-col active:opacity-80", product.is_archived && "opacity-80")}
      >
        {/* Photo area */}
        <div className={cn("flex h-24 w-full items-center justify-center", CATEGORY_BG[cat])}>
          {product.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-4xl">{CATEGORY_EMOJI[cat]}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p
            className={cn(
              "line-clamp-2 text-sm font-semibold leading-tight",
              product.is_archived && "text-muted-foreground"
            )}
          >
            {product.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                product.is_in_pan
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {product.is_in_pan ? "In Pan" : "Not In Pan"}
            </span>
            {product.is_archived && (
              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Archived
              </span>
            )}
          </div>
        </div>
      </Link>

      {product.is_archived && onRestore && (
        <div className="border-t border-border/60 p-3 pt-2">
          <button
            type="button"
            onClick={() => onRestore(product.id)}
            disabled={restoring}
            className="flex h-10 w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-900 disabled:opacity-50 active:opacity-80"
          >
            {restoring ? "Restoring…" : "Restore Product"}
          </button>
        </div>
      )}
    </div>
  )
}
