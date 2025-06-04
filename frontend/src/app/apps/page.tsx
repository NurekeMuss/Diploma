"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AppWindow, Search, Loader2, AlertCircle, Package, Grid3X3, List } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const BASE_URL = "http://127.0.0.1:8000"

interface SystemInfo {
  installed_apps: string
}

export default function AppsPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installedApps, setInstalledApps] = useState<string[]>([])
  const [filteredApps, setFilteredApps] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get<SystemInfo>(`${BASE_URL}/system-info`)
        setSystemInfo(response.data)
        parseInstalledApps(response.data.installed_apps)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching system info:", error)
        setError("Failed to fetch installed applications. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchSystemInfo()
  }, [])

  const parseInstalledApps = (appsData: string) => {
    // Format is typically "package:com.example.app"
    const appLines = appsData.split("\n").filter((line) => line.trim() !== "")
    const apps = appLines
      .map((line) => {
        const match = line.match(/package:(.*)/i)
        return match ? match[1] : line
      })
      .sort()

    setInstalledApps(apps)
    setFilteredApps(apps)
  }

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredApps(installedApps)
    } else {
      const filtered = installedApps.filter((app) => app.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredApps(filtered)
    }
  }, [searchTerm, installedApps])

  const getAppDisplayName = (packageName: string) => {
    // Extract a more readable name from package name
    const parts = packageName.split(".")
    return parts[parts.length - 1] || packageName
  }

  const getAppCategory = (packageName: string) => {
    if (packageName.includes("google")) return "Google"
    if (packageName.includes("android")) return "System"
    if (packageName.includes("samsung")) return "Samsung"
    if (packageName.includes("com.facebook") || packageName.includes("com.instagram")) return "Social"
    if (packageName.includes("game")) return "Games"
    return "Other"
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading installed applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
            Installed Applications
          </h1>
          <p className="text-muted-foreground mt-2">Manage and view all applications installed on the device</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredApps.length} Apps
        </Badge>
      </div>

      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl text-primary">
                <Package className="mr-2 h-5 w-5 text-primary" />
                Application Manager
              </CardTitle>
              <CardDescription>Search and browse installed applications</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search applications..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          </div>

          <div className="border rounded-md h-[500px] overflow-y-auto">
            {filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <AppWindow className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No applications found matching your search" : "No applications found"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {filteredApps.map((app, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-transparent hover:border-[#FF6392]/20"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white mb-3">
                      <AppWindow className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-center mb-2" title={app}>
                      {getAppDisplayName(app)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getAppCategory(app)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2 text-center truncate w-full" title={app}>
                      {app}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApps.map((app, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white mr-4">
                      <AppWindow className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{getAppDisplayName(app)}</p>
                      <p className="text-sm text-muted-foreground truncate" title={app}>
                        {app}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {getAppCategory(app)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
