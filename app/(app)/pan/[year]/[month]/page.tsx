import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { PanView } from "@/components/pan/PanView"
import { getPanTabData, getWishlistProductIds } from "@/lib/loaders/tab-data"

interface PanPageProps {
  params: Promise<{ year: string; month: string }>
}

export default async function PanPage({ params }: PanPageProps) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const { year: yearParam, month: monthParam } = await params
  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date()
    redirect(`/pan/${now.getFullYear()}/${now.getMonth() + 1}`)
  }

  const [{ entries, error }, wishlistedIds] = await Promise.all([
    getPanTabData(user.id, year, month),
    getWishlistProductIds(user.id),
  ])

  return (
    <PanView
      year={year}
      month={month}
      entries={entries}
      error={error ?? undefined}
      wishlistedProductIds={new Set(wishlistedIds)}
    />
  )
}
