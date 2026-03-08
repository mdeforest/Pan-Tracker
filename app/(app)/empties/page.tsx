import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { listEmpties } from "@/lib/services/empties"
import { EmptiesClient } from "@/components/empties/EmptiesClient"
import type { EmptyCardData } from "@/components/empties/EmptyCard"
import type { ProductCategory, WouldRepurchase } from "@/lib/types/app"

export default async function EmptiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data, error } = await listEmpties(user.id, {})

  if (error) {
    console.error("EmptiesPage: failed to fetch empties", {
      userId: user.id,
      error: error.message,
    })
  }

  // Normalize the Supabase join shape to our clean type
  const empties: EmptyCardData[] = ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawProduct = r.products
    const product = Array.isArray(rawProduct)
      ? (rawProduct[0] ?? null)
      : (rawProduct ?? null)
    return {
      id: r.id as string,
      finished_month: r.finished_month as number,
      finished_year: r.finished_year as number,
      rating: (r.rating as number | null) ?? null,
      would_repurchase: (r.would_repurchase as WouldRepurchase | null) ?? null,
      review_notes: (r.review_notes as string | null) ?? null,
      replacement_free_text: (r.replacement_free_text as string | null) ?? null,
      products: product
        ? {
            id: (product as Record<string, unknown>).id as string,
            name: (product as Record<string, unknown>).name as string,
            brand: (product as Record<string, unknown>).brand as string,
            category: (product as Record<string, unknown>).category as ProductCategory,
            photo_url: ((product as Record<string, unknown>).photo_url as string | null) ?? null,
          }
        : null,
    }
  })

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Empties</h1>
      </div>
      <EmptiesClient empties={empties} />
    </div>
  )
}
