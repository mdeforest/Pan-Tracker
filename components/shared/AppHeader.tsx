"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { UserMenu } from "./UserMenu"

interface AppHeaderProps {
  avatarUrl: string | null
  name: string | null
}

function getBackHref(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)

  if (segments[0] === "products" && segments.length > 1) {
    return "/products"
  }

  if (segments[0] === "empties" && segments.length > 1) {
    return "/empties"
  }

  if (segments[0] === "pan" && segments.length > 3) {
    return `/pan/${segments[1]}/${segments[2]}`
  }

  return null
}

export function AppHeader({ avatarUrl, name }: AppHeaderProps) {
  const pathname = usePathname()
  const backHref = getBackHref(pathname)

  return (
    <header className="sticky top-0 z-40 bg-card shadow-sm md:hidden">
      <div className="relative flex h-14 items-center justify-between px-4">
        <div className="flex w-12 justify-start">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground active:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : null}
        </div>

        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <span className="pt-[0.95rem] text-base font-semibold tracking-tight">PanTracker</span>
        </div>

        <div className="flex w-12 justify-end">
          <UserMenu avatarUrl={avatarUrl} name={name} />
        </div>
      </div>
    </header>
  )
}
