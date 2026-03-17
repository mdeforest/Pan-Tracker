import { redirect } from "next/navigation"
import { EmptiesClient } from "@/components/empties/EmptiesClient"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getEmptiesTabData } from "@/lib/loaders/tab-data"

interface EmptiesPageProps {
  searchParams: Promise<{ import?: string }>
}

export default async function EmptiesPage({ searchParams }: EmptiesPageProps) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const params = await searchParams
  const initialImportOpen = params.import === "1" || params.import === "true"

  const { empties } = await getEmptiesTabData(user.id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Empties</h1>
      </div>
      <EmptiesClient
        key={initialImportOpen ? "import-open" : "import-closed"}
        empties={empties}
        initialImportOpen={initialImportOpen}
      />
    </div>
  )
}
