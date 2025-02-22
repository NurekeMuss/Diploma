import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider defaultOpen>
          <div className="flex h-screen">
            <AppSidebar />
            <main className="flex-1 overflow-auto p-4">{children}</main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}

