"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import {
  AlertCircle,
  Loader2,
  Search,
  Smartphone,
  Download,
  FileIcon,
  FileText,
  Heart,
  Star,
  Sparkles,
  RefreshCw,
  Calendar,
} from "lucide-react"
import toast, { Toaster } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface FileItem {
  name: string
  url: string
}

interface FileData {
  photos: FileItem[]
  videos: FileItem[]
  documents: FileItem[]
  others: FileItem[]
}

interface DeviceInfo {
  serial_number: string
  brand: string
  device: string
  model: string
}

interface DevicesResponse {
  "device-info": DeviceInfo[]
  error?: string
}

interface ReportParams {
  category: string
  date_after: string
  date_before: string
  limit: number
}

const BASE_URL = "http://127.0.0.1:8000"

export default function MediaPage() {
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<keyof FileData>("photos")

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const response = await axios.get<DevicesResponse>(`${BASE_URL}/`)

        // Check if the response contains an error field indicating device not connected
        if (response.data && response.data.error) {
          setError("Device not connected. Please connect your device and try again.")
          setIsLoading(false)
          return
        }

        if (response.data["device-info"].length > 0) {
          setDeviceInfo(response.data["device-info"][0])
          await fetchFiles()
        } else {
          setError("Device not connected. Please connect your device and try again.")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching device info:", error)

        // Check if the error is related to device connection
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404 || error.response.status === 503) {
            setError("Device not connected. Please connect your device and try again.")
          } else {
            setError("Failed to fetch device information. Please try again later.")
          }
        } else {
          setError("Device not connected or server is unavailable. Please check your connections.")
        }

        setIsLoading(false)
      }
    }

    const fetchFiles = async () => {
      try {
        const response = await axios.get<FileData>(`${BASE_URL}/all-files`)
        setFileData(response.data)
        setIsLoading(false)
        setError(null)
      } catch (error) {
        console.error("Error fetching files:", error)

        // Check if the error is related to device connection
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404 || error.response.status === 503) {
            setError("Device not connected. Please connect your device and try again.")
          } else {
            setError("Failed to fetch files. Please try again later.")
          }
        } else {
          setError("Failed to fetch files. Please try again later.")
        }

        setIsLoading(false)
      }
    }

    fetchDeviceInfo()
  }, [])

  const filteredFileData = useMemo(() => {
    if (!fileData) return null
    const lowerSearchTerm = searchTerm.toLowerCase()
    return Object.entries(fileData).reduce((acc, [key, files]) => {
      acc[key as keyof FileData] = files.filter((file: { name: string }) =>
        file.name.toLowerCase().includes(lowerSearchTerm),
      )
      return acc
    }, {} as FileData)
  }, [fileData, searchTerm])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "photos":
        return <Heart className="mr-2 h-4 w-4 text-primary" />
      case "videos":
        return <Star className="mr-2 h-4 w-4 text-secondary" />
      case "documents":
        return <FileText className="mr-2 h-4 w-4 text-primary" />
      default:
        return <Sparkles className="mr-2 h-4 w-4 text-secondary" />
    }
  }

  const renderRow =
    (items: FileItem[]) =>
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index]
      const downloadUrl = item.url

      return (
        <div style={style} className="flex items-center p-2 hover:bg-accent/20 rounded-md">
          <FileIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate">{item.name}</span>
          <Button variant="ghost" size="sm" asChild>
            <a href={downloadUrl} download={item.name} className="flex items-center">
              <Download className="mr-1 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      )
    }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading media files...</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center text-primary">
              <Smartphone className="mr-2 h-5 w-5" />
              Media Files
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              {error.includes("Device not connected") ? (
                <>
                  <Smartphone className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Device Not Connected</h3>
                  <p className="text-muted-foreground max-w-md">
                    Please connect your Android device via USB and ensure USB debugging is enabled.
                  </p>
                  <Button className="mt-6" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Connection
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Unable to load media files. Please try again later.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!fileData || !deviceInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No file data or device information available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster position="top-right" />

      <h1 className="mb-6 text-3xl font-bold text-primary">Media Files</h1>

      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card">
          <CardTitle className="flex items-center text-xl text-primary">
            <Heart className="mr-2 h-5 w-5 text-primary" />
            Connected Device
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Brand</p>
            <p className="font-medium">{deviceInfo.brand}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Model</p>
            <p className="font-medium">{deviceInfo.model}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serial Number</p>
            <p className="font-medium">{deviceInfo.serial_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Device</p>
            <p className="font-medium">{deviceInfo.device}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card">
          <CardTitle className="text-xl text-primary">
            <Star className="inline-block mr-2 h-5 w-5 text-secondary" />
            Browse Files
          </CardTitle>
          <CardDescription>Search and download files from your device</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as keyof FileData)}>
            <TabsList className="grid w-full grid-cols-4">
              {(Object.keys(fileData) as Array<keyof FileData>).map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {getCategoryIcon(category as string)}
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {filteredFileData?.[category].length ?? 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(fileData) as Array<keyof FileData>).map((category) => (
              <TabsContent key={category} value={category}>
                {filteredFileData?.[category].length === 0 ? (
                  <div className="text-muted-foreground text-center py-8 bg-muted/10 rounded-md">
                    <p>No matching files found.</p>
                  </div>
                ) : (
                  <div className="h-[400px] border rounded-md">
                    <AutoSizer>
                      {({ height, width }) => (
                        <List
                          height={height}
                          itemCount={filteredFileData?.[category].length ?? 0}
                          itemSize={50}
                          width={width}
                        >
                          {renderRow(filteredFileData?.[category] ?? [])}
                        </List>
                      )}
                    </AutoSizer>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card">
          <CardTitle className="text-xl text-primary">
            <Sparkles className="inline-block mr-2 h-5 w-5 text-primary" />
            Generate Category Report
          </CardTitle>
          <CardDescription>Create a filtered PDF report of files by category and date range</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <ReportGenerator />
        </CardContent>
      </Card>
    </div>
  )
}

function ReportGenerator() {
  const [reportParams, setReportParams] = useState<ReportParams>({
    category: "images",
    date_after: "",
    date_before: "",
    limit: 10,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Set default date_after to 30 days ago
  useEffect(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const defaultDateAfter = thirtyDaysAgo.toISOString().split("T")[0]

    setReportParams((prev) => ({
      ...prev,
      date_after: defaultDateAfter,
    }))
  }, [])

  const handleGenerateReport = useCallback(async () => {
    // Validate required fields
    if (!reportParams.date_after) {
      toast.error("Date after is required", {
        duration: 4000,
      })
      return
    }

    try {
      setIsGenerating(true)
      setProgress(0)

      // Simulate progress while generating report
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      // Build query parameters
      const queryParams = new URLSearchParams({
        category: reportParams.category,
        date_after: reportParams.date_after,
        limit: reportParams.limit.toString(),
      })

      // Add date_before only if it's provided
      if (reportParams.date_before) {
        queryParams.append("date_before", reportParams.date_before)
      }

      const response = await axios.get(`${BASE_URL}/generate-category-report?${queryParams.toString()}`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      })

      clearInterval(progressInterval)
      setProgress(100)

      // Get the filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers["content-disposition"]
      let filename = `${reportParams.category}_report_${reportParams.date_after}.pdf`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
        }
      }

      // Create and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`Report "${filename}" downloaded successfully`, {
        duration: 3000,
        icon: "📄",
      })
    } catch (error) {
      console.error("Error generating report:", error)

      let errorMessage = "Failed to generate report. Please try again."

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400) {
          errorMessage = "Invalid parameters. Please check your input values."
        } else if (error.response.status === 404) {
          errorMessage = "Report generation service not found. Please contact support."
        } else if (error.response.status === 500) {
          errorMessage = "Server error occurred while generating report."
        }
      }

      toast.error(errorMessage, {
        duration: 4000,
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }, [reportParams])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Category
            </CardTitle>
            <CardDescription>Select file category for the report</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={reportParams.category}
              onValueChange={(value) => setReportParams((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Date After *
            </CardTitle>
            <CardDescription>Files created after this date</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="date_after"
              type="date"
              value={reportParams.date_after}
              onChange={(e) => setReportParams((prev) => ({ ...prev, date_after: e.target.value }))}
              required
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Date Before
            </CardTitle>
            <CardDescription>Files created before this date (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="date_before"
              type="date"
              value={reportParams.date_before}
              onChange={(e) => setReportParams((prev) => ({ ...prev, date_before: e.target.value }))}
              min={reportParams.date_after}
            />
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Limit</CardTitle>
            <CardDescription>Maximum number of files to include</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="limit"
              type="number"
              value={reportParams.limit}
              onChange={(e) => setReportParams((prev) => ({ ...prev, limit: Number.parseInt(e.target.value) || 10 }))}
              min={1}
              max={1000}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-[#FF6392]/20">
        <CardContent className="pt-6">
          {isGenerating && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Generating {reportParams.category} report... {progress}%
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 text-sm text-muted-foreground">
              <p>
                <strong>Report Summary:</strong> Generate a PDF report for{" "}
                <span className="font-medium text-foreground">{reportParams.category}</span> files
                {reportParams.date_after && (
                  <>
                    {" "}
                    created after <span className="font-medium text-foreground">{reportParams.date_after}</span>
                  </>
                )}
                {reportParams.date_before && (
                  <>
                    {" "}
                    and before <span className="font-medium text-foreground">{reportParams.date_before}</span>
                  </>
                )}
                , limited to <span className="font-medium text-foreground">{reportParams.limit}</span> files.
              </p>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportParams.date_after}
              size="lg"
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
