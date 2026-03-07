import { PanSkeleton } from "@/components/pan/PanSkeleton"

export default function PanLoading() {
  return (
    <>
      {/* Month nav placeholder */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
      </div>
      <PanSkeleton />
    </>
  )
}
