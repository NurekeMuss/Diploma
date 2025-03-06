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
}

interface ReportParams {
  category: string
  filter_path: string
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
        if (response.data["device-info"].length > 0) {
          setDeviceInfo(response.data["device-info"][0])
          await fetchFiles()
        } else {
          setError("No device connected. Please connect a device.")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching device info:", error)
        setError("Failed to fetch device information. Please try again later.")
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
        setError("Failed to fetch files. Please try again later.")
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
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Unable to load media files. Please try again later.</p>
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
            Generate Report
          </CardTitle>
          <CardDescription>Create a PDF report of files on your device</CardDescription>
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
    category: "documents",
    filter_path: "/Documents/",
    limit: 10,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleGenerateReport = useCallback(async () => {
    try {
      setIsGenerating(true)
      setProgress(0)

      // Simulate progress while generating report
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 500)

      const response = await axios.post(`${BASE_URL}/report/generate/${reportParams.category}`, null, {
        params: {
          filter_path: reportParams.filter_path,
          limit: reportParams.limit,
        },
        responseType: "blob",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })

      clearInterval(progressInterval)
      setProgress(100)

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"]
      const filename = contentDisposition ? contentDisposition.split("filename=")[1] : "images_report.pdf"

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
      toast.error("Failed to generate report. Please try again.", {
        duration: 4000,
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }, [reportParams])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category</CardTitle>
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
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-[#FF6392]/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filter Path</CardTitle>
            <CardDescription>Specify the path to filter files</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="filter_path"
              value={reportParams.filter_path}
              onChange={(e) => setReportParams((prev) => ({ ...prev, filter_path: e.target.value }))}
              placeholder="/path/to/files/"
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
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-[#FF6392]/20">
        <CardContent className="pt-6">
          {isGenerating && (
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">Generating report... {progress}%</p>
            </div>
          )}

          <Button onClick={handleGenerateReport} className="w-full" disabled={isGenerating} size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating PDF Report...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Generate PDF Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

