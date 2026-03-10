export default function StatsLoading() {
  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        {/* Streak hero */}
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />

        {/* Two stat cards side by side */}
        <div className="flex gap-3">
          <div className="h-24 flex-1 animate-pulse rounded-2xl bg-muted" />
          <div className="h-24 flex-1 animate-pulse rounded-2xl bg-muted" />
        </div>

        {/* Monthly trend chart */}
        <div className="h-52 animate-pulse rounded-2xl bg-muted" />

        {/* Category breakdown chart */}
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />

        {/* Top brands list */}
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />

        {/* Avg time to pan */}
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  )
}
