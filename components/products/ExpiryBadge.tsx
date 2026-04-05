interface ExpiryBadgeProps {
  expirationDate: string | null
}

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })

export function ExpiryBadge({ expirationDate }: ExpiryBadgeProps) {
  if (!expirationDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expirationDate)
  const daysLeft = Math.round(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysLeft > 180) return null

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

  // 91–180 days
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
      Exp. {MONTH_FMT.format(expiry)}
    </span>
  )
}
