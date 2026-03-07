"use client"

import { useState } from "react"
import Image from "next/image"
import { signOut } from "@/lib/actions/auth"

interface UserMenuProps {
  avatarUrl: string | null
  name: string | null
}

export function UserMenu({ avatarUrl, name }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
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

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-50 min-w-[140px] rounded-lg border bg-background shadow-lg">
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
  )
}
