import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStatsTabData } from "@/lib/loaders/tab-data"
import { StatsClient } from "@/components/stats/StatsClient"

export default async function StatsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const stats = await getStatsTabData(user.id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Stats</h1>
      </div>
      <StatsClient stats={stats} />
    </div>
  )
}
