import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "System Information - Dashboard App",
  description: "View detailed system information about the connected device",
}

export default function SystemLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}

