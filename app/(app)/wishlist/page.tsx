import { redirect } from "next/navigation"
import { WishlistClient } from "@/components/wishlist/WishlistClient"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getWishlistTabData } from "@/lib/loaders/tab-data"

export default async function WishlistPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const { wishlistItems, productOptions } = await getWishlistTabData(user.id)

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold tracking-tight">Wishlist</h1>
      </div>
      <WishlistClient initialItems={wishlistItems} productOptions={productOptions} />
    </div>
  )
}
