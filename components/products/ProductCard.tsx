import Link from "next/link"
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
}

interface ProductCardProps {
  product: ProductCardData
}

export function ProductCard({ product }: ProductCardProps) {
  const cat = product.category

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden active:opacity-80 min-h-[160px]"
    >
      {/* Photo area */}
      <div className={cn("flex items-center justify-center h-24 w-full", CATEGORY_BG[cat])}>
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="text-4xl">{CATEGORY_EMOJI[cat]}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 gap-1">
        <p className="text-sm font-semibold leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
        <div className="mt-auto pt-1">
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
        </div>
      </div>
    </Link>
  )
}
