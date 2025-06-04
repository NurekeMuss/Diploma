"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageCircle,
  PhoneCall,
  Menu,
  X,
  UserCircle,
  GalleryHorizontalEnd,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Cpu,
  AppWindow,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Calls", href: "/calls", icon: PhoneCall },
  { name: "Media", href: "/media", icon: GalleryHorizontalEnd },
  { name: "Apps", href: "/apps", icon: AppWindow },
  { name: "System", href: "/system", icon: Cpu },
  { name: "Profile", href: "/profile", icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-full bg-primary p-2 text-primary-foreground md:hidden shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out border-r border-[#FF6392]/20 shadow-sm md:relative",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-[#FF6392]/20 px-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] text-white">
                <span className="font-bold text-lg">D</span>
              </div>
              {!isCollapsed && (
                <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
                  Dashboard
                </h1>
              )}
            </div>

            {/* Collapse button - only visible on desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight
                className={cn("h-5 w-5 text-gray-500 transition-transform", isCollapsed ? "rotate-180" : "")}
              />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-6 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>

            {!isCollapsed && (
              <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white">
                    <span className="font-bold">P</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Premium Plan</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upgrade for more features</p>
                  </div>
                </div>
                <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-[#FF6392]/20 px-3 py-4">
            <div className="space-y-1">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn(
                  "w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative",
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {isDarkMode ? (
                  <>
                    <Sun className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span>Light Mode</span>}
                  </>
                ) : (
                  <>
                    <Moon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
                    {!isCollapsed && <span>Dark Mode</span>}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-6 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </div>
                )}
              </button>
            </div>

            {/* User info */}
            <div className={cn("mt-4 pt-4 border-t border-[#FF6392]/20", isCollapsed ? "text-center" : "")}>
              <div className={cn("flex items-center", isCollapsed ? "flex-col" : "")}>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white">
                  <UserCircle className="h-6 w-6" />
                </div>
              </div>

              {!isCollapsed && (
                <button
                  className="mt-3 w-full flex items-center justify-center rounded-lg border border-[#FF6392]/20 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => {
                    localStorage.clear()
                    window.location.href = "auth/login" // Redirect to login page
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
