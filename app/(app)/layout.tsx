import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/shared/BottomNav"
import { AppHeader } from "@/components/shared/AppHeader"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    <div className="flex min-h-screen flex-col">
      <AppHeader avatarUrl={avatarUrl} name={name} />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
