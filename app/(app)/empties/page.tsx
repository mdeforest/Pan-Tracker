import { redirect } from "next/navigation"
import { EmptiesClient } from "@/components/empties/EmptiesClient"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getEmptiesTabData } from "@/lib/loaders/tab-data"

export default async function EmptiesPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

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
