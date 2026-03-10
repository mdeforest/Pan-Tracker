import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { ToastProvider } from "@/components/shared/ToastProvider"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "PanTracker",
  description: "Track your beauty project pan — finish products before buying new ones.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PanTracker",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
