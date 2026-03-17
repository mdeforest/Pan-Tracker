import { redirect } from "next/navigation"
import { EmptiesClient } from "@/components/empties/EmptiesClient"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getEmptiesTabData } from "@/lib/loaders/tab-data"

interface EmptiesPageProps {
  searchParams: Promise<{ import_month?: string }>
}

export default async function EmptiesPage({ searchParams }: EmptiesPageProps) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const params = await searchParams
  // We can eventually use import_month to auto-filter, but for now we just remove the sheet trigger

  const { empties } = await getEmptiesTabData(user.id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Empties</h1>
      </div>
      <EmptiesClient empties={empties} />
    </div>
  )
}
