import { redirect } from "next/navigation"
import { ProductsClient } from "@/components/products/ProductsClient"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getProductsTabData } from "@/lib/loaders/tab-data"

export default async function ProductsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const { activeProductIds, initialProducts } = await getProductsTabData(user.id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Products</h1>
      </div>
      <ProductsClient
        activeProductIds={activeProductIds}
        initialProducts={initialProducts}
      />
    </div>
  )
}
