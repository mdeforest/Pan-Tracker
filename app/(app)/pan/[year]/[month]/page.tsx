import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { PanView } from "@/components/pan/PanView"
import { getPanTabData } from "@/lib/loaders/tab-data"

interface PanPageProps {
  params: { year: string; month: string }
}

export default async function PanPage({ params }: PanPageProps) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const year = parseInt(params.year, 10)
  const month = parseInt(params.month, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    const now = new Date()
    redirect(`/pan/${now.getFullYear()}/${now.getMonth() + 1}`)
  }

  const { entries, error } = await getPanTabData(user.id, year, month)

  return <PanView year={year} month={month} entries={entries} error={error ?? undefined} />
}
