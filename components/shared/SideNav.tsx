"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BarChart2, FlaskConical, Package, Sparkles } from "lucide-react"
import { cn, currentYearMonth } from "@/lib/utils"
import { signOut } from "@/lib/actions/auth"

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

interface SideNavProps {
  avatarUrl: string | null
  name: string | null
}

export function SideNav({ avatarUrl, name }: SideNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  useEffect(() => {
    NAV_ITEMS.forEach(({ href, match }) => {
      if (!match.test(pathname)) {
        router.prefetch(href)
      }
    })
  }, [pathname, router])

  return (
    <nav
      className="hidden md:flex flex-col w-16 shrink-0 border-r border-border bg-white"
      aria-label="Main navigation"
    >
      {/* Logo mark */}
      <div className="flex h-16 items-center justify-center border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="6.1" y="1.8" width="3.8" height="2.1" rx="0.7" fill="white" />
            <rect x="4.3" y="3.9" width="7.4" height="10.1" rx="2" stroke="white" strokeWidth="1.2" />
            <path d="M6.3 8h3.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="8" cy="10.6" r="1.05" fill="white" />
          </svg>
        </div>
      </div>

      {/* Nav items */}
      <ul className="flex flex-1 flex-col items-center gap-1 pt-4 px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon, match }) => {
          const isActive = match.test(pathname)
          return (
            <li key={href} className="w-full">
              <Link
                href={href}
                onMouseEnter={() => {
                  if (!isActive) router.prefetch(href)
                }}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                title={label}
                className={cn(
                  "relative flex h-11 w-full items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />
                )}
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
              </Link>
            </li>
          )
        })}
      </ul>

      {/* User avatar + menu at bottom */}
      <div className="flex flex-col items-center gap-2 pb-4 px-2 relative">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name ?? "User avatar"}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-12 left-0 z-50 min-w-[140px] rounded-lg border bg-background shadow-lg">
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
                >
                  Wishlist
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
