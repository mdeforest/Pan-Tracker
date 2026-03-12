import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS, CATEGORY_EMOJI } from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

export interface ProductCardData {
  id: string
  name: string
  brand: string
  category: ProductCategory
  photo_url: string | null
  is_in_pan: boolean
  is_archived: boolean
  last_bought_at: string
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })

interface ProductCardProps {
  product: ProductCardData
  onRestore?: (productId: string) => void
  restoring?: boolean
}

export function ProductCard({ product, onRestore, restoring = false }: ProductCardProps) {
  const cat = product.category
  const categoryLabel = CATEGORY_LABELS[cat] ?? cat

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-shadow hover:shadow-md",
        product.is_archived && "opacity-70"
      )}
    >
      <Link
        href={`/products/${product.id}`}
        className="flex flex-col active:opacity-80"
      >
        {/* Photo — square, full-bleed */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary">
              <span className="text-5xl opacity-60">{CATEGORY_EMOJI[cat]}</span>
            </div>
          )}

          {/* Category badge overlay */}
          <span className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
            {categoryLabel}
          </span>

          {/* In-pan badge */}
          {product.is_in_pan && (
            <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              In Pan
            </span>
          )}

          {/* Archived badge */}
          {product.is_archived && (
            <span className="absolute right-2 top-2 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Archived
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-0.5 p-3">
          <p
            className={cn(
              "line-clamp-2 text-xs font-bold uppercase tracking-wide leading-tight",
              product.is_archived ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {product.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{product.brand}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Bought {DATE_FMT.format(new Date(product.last_bought_at))}
          </p>
        </div>
      </Link>

      {product.is_archived && onRestore && (
        <div className="border-t border-border/60 px-3 pb-3">
          <button
            type="button"
            onClick={() => onRestore(product.id)}
            disabled={restoring}
            className="flex h-9 w-full items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary disabled:opacity-50 active:opacity-80"
          >
            {restoring ? "Restoring…" : "Restore"}
          </button>
        </div>
      )}
    </div>
  )
}
