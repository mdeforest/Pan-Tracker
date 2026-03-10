export default function ProductsLoading() {
  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="sticky top-14 z-30 bg-background pb-1">
        <div className="px-4 pt-3 pb-2">
          <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="flex gap-2 overflow-hidden px-4 pb-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        <div className="px-4 pb-2">
          <div className="h-20 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
