"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FlaskConical, Package, Sparkles } from "lucide-react"
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
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
