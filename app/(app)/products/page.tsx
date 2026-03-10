import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/products/ProductsClient"
import { listProducts } from "@/lib/services/products"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: activeEntries }, { data: initialProducts }] = await Promise.all([
    supabase
      .from("pan_entries")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("status", "active"),
    listProducts(user.id),
  ])

  const activeProductIds = (activeEntries ?? []).map((e) => e.product_id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Products</h1>
      </div>
      <ProductsClient
        activeProductIds={activeProductIds}
        initialProducts={initialProducts ?? []}
      />
    </div>
  )
}
