import { redirect } from "next/navigation"

// Redirect to current month's pan view; auth check happens in middleware
export default function RootPage() {
  const now = new Date()
  redirect(`/pan/${now.getFullYear()}/${now.getMonth() + 1}`)
}
