import { redirect } from "next/navigation"
import { BottomNav } from "@/components/shared/BottomNav"
import { AppHeader } from "@/components/shared/AppHeader"
import { SideNav } from "@/components/shared/SideNav"
import { getCurrentUser } from "@/lib/auth/get-current-user"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const avatarUrl = (user.user_metadata?.avatar_url as string | null) ?? null
  const name =
    (user.user_metadata?.full_name as string | null) ??
    (user.user_metadata?.name as string | null) ??
    user.email ??
    null

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      {/* Mobile: sticky top header */}
      <AppHeader avatarUrl={avatarUrl} name={name} />

      {/* Desktop: left sidebar */}
      <SideNav avatarUrl={avatarUrl} name={name} />

      {/* Main content */}
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:overflow-y-auto">
        {children}
      </main>

      {/* Mobile: fixed bottom nav */}
      <BottomNav />
    </div>
  )
}
