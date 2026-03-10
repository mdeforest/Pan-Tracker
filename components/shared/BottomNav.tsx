"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart2, FlaskConical, Package, Sparkles } from "lucide-react"
import { cn, currentYearMonth } from "@/lib/utils"

const { year, month } = currentYearMonth()

const NAV_ITEMS = [
  {
    label: "Pan",
    href: `/pan/${year}/${month}`,
    icon: Sparkles,
    match: /^\/pan/,
  },
  {
    label: "Empties",
    href: "/empties",
    icon: FlaskConical,
    match: /^\/empties/,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    match: /^\/products/,
  },
  {
    label: "Stats",
    href: "/stats",
    icon: BarChart2,
    match: /^\/stats/,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    NAV_ITEMS.forEach(({ href, match }) => {
      if (!match.test(pathname)) {
        router.prefetch(href)
      }
    })
  }, [pathname, router])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[oklch(0.13_0_0)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <ul className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ label, href, icon: Icon, match }) => {
          const isActive = match.test(pathname)
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                onMouseEnter={() => {
                  if (!isActive) router.prefetch(href)
                }}
                onTouchStart={() => {
                  if (!isActive) router.prefetch(href)
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon
                  className="h-6 w-6"
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
