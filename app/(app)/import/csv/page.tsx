import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { CsvImportClient } from "./CsvImportClient"

export default async function CsvImportPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Import History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bulk import products into your empties, current pans, or backlog.
        </p>
      </div>
      <CsvImportClient />
    </div>
  )
}
