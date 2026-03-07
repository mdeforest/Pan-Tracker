interface ProductDetailPageProps {
  params: { id: string }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Product Detail</h1>
      <p className="text-sm text-muted-foreground">{params.id}</p>
      {/* Product detail — Phase 4+ */}
    </div>
  )
}
