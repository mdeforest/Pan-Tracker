export function PanSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm"
              >
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="mb-1.5 h-4 w-32 animate-pulse rounded-full bg-muted" />
                  <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
