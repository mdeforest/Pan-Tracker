export default function EmptiesLoading() {
  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="sticky top-14 z-30 bg-background">
        <div className="flex gap-2 overflow-hidden px-4 pt-3 pb-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`m-${idx}`} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        <div className="flex gap-2 overflow-hidden px-4 pb-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`c-${idx}`} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
