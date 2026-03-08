import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProduct, getProductPanHistory } from "@/lib/services/products"
import { ProductDetailClient } from "@/components/products/ProductDetailClient"
import type { ProductCategory, UsageLevel, WouldRepurchase } from "@/lib/types/app"

interface ProductDetailPageProps {
  params: { id: string }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [productResult, historyResult, activeResult] = await Promise.all([
    getProduct(user.id, params.id),
    getProductPanHistory(user.id, params.id),
    supabase
      .from("pan_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", params.id)
      .eq("status", "active")
      .maybeSingle(),
  ])

  if (productResult.error || !productResult.data) {
    if (productResult.error?.code === "PGRST116") notFound()
    console.error("ProductDetailPage: failed to fetch product", {
      userId: user.id,
      productId: params.id,
      error: productResult.error?.message,
    })
    notFound()
  }

  const product = productResult.data

  // Normalize pan history — empties is a nested array join
  const panHistory = ((historyResult.data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawEmpties = r.empties
    const empties = Array.isArray(rawEmpties) ? rawEmpties : []
    return {
      id: r.id as string,
      started_month: r.started_month as number,
      started_year: r.started_year as number,
      status: r.status as string,
      usage_level: r.usage_level as UsageLevel,
      notes: (r.notes as string | null) ?? null,
      empties: empties.map((e) => {
        const em = e as Record<string, unknown>
        return {
          id: em.id as string,
          finished_month: em.finished_month as number,
          finished_year: em.finished_year as number,
          rating: (em.rating as number | null) ?? null,
          would_repurchase: (em.would_repurchase as WouldRepurchase | null) ?? null,
          review_notes: (em.review_notes as string | null) ?? null,
          replacement_free_text: (em.replacement_free_text as string | null) ?? null,
        }
      }),
    }
  })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category as ProductCategory,
        photo_url: product.photo_url ?? null,
        notes: product.notes ?? null,
      }}
      panHistory={panHistory}
      isInPan={!!activeResult.data}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  )
}
