import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Media Files - Dashboard App",
  description: "Browse and manage media files from your device",
}

export default function MediaLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
