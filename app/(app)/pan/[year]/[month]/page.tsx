interface PanPageProps {
  params: { year: string; month: string }
}

export default function PanPage({ params }: PanPageProps) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Active Pan</h1>
      <p className="text-sm text-muted-foreground">
        {params.month}/{params.year}
      </p>
      {/* Pan grid — Phase 3+ */}
    </div>
  )
}
