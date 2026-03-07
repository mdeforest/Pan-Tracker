import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPanEntries } from "@/lib/services/pan"
import { PanView } from "@/components/pan/PanView"
import type { PanEntryWithProduct } from "@/components/pan/types"

interface PanPageProps {
  params: { year: string; month: string }
}

export default async function PanPage({ params }: PanPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const year = parseInt(params.year, 10)
  const month = parseInt(params.month, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date()
    redirect(`/pan/${now.getFullYear()}/${now.getMonth() + 1}`)
  }

  const { entriesResult, picksResult } = await getPanEntries(user.id, year, month)

  if (entriesResult.error) {
    console.error("PanPage: failed to fetch pan entries", {
      userId: user.id,
      error: entriesResult.error.message,
    })
    return (
      <PanView
        year={year}
        month={month}
        entries={[]}
        error={entriesResult.error.message}
      />
    )
  }

  const pickIds = new Set((picksResult.data ?? []).map((p) => p.pan_entry_id))

  // Supabase types `products` as an array due to relationship config, but runtime gives a single
  // object. We cast explicitly to our clean PanEntryWithProduct type.
  const entries = ((entriesResult.data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawProducts = r.products
    const product = Array.isArray(rawProducts) ? (rawProducts[0] ?? null) : (rawProducts ?? null)
    return {
      ...r,
      products: product,
      is_pick: pickIds.has(r.id as string),
    } as PanEntryWithProduct
  })

  return <PanView year={year} month={month} entries={entries} />
}
