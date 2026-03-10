import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="text-5xl">🔍</div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/pan"
        className="rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background active:opacity-80"
      >
        Go to my pan
      </Link>
    </div>
  )
}
