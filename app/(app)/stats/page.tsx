import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStatsTabData } from "@/lib/loaders/tab-data"
import { StatsClient } from "@/components/stats/StatsClient"

export default async function StatsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const stats = await getStatsTabData(user.id)

  return (
    <div className="min-h-full bg-gray-50/30">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Your Stats
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          A breakdown of your panning progress and habits.
        </p>
      </div>
      <StatsClient stats={stats} />
    </div>
  )
}
