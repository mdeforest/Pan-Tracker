interface ExpiryBadgeProps {
  expirationDate: string | null
  /**
   * When true, always renders a badge even if expiry is far in the future.
   * Defaults to false (only shows within 180 days) — keeps product cards uncluttered.
   */
  alwaysShow?: boolean
}

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })

export function ExpiryBadge({ expirationDate, alwaysShow = false }: ExpiryBadgeProps) {
  if (!expirationDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expirationDate + "T00:00:00")
  const daysLeft = Math.round(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (!alwaysShow && daysLeft > 180) return null

  if (daysLeft <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Expired
      </span>
    )
  }

  if (daysLeft <= 30) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Exp. in {daysLeft}d
      </span>
    )
  }

  if (daysLeft <= 90) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        Exp. {MONTH_FMT.format(expiry)}
      </span>
    )
  }

  if (daysLeft <= 180) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
        Exp. {MONTH_FMT.format(expiry)}
      </span>
    )
  }

  // > 180 days — only shown when alwaysShow=true
  return (
    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
      Exp. {MONTH_FMT.format(expiry)}
    </span>
  )
}
