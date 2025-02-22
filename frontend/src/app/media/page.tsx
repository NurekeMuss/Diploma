"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { AlertCircle, Camera, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

interface DevicesResponse {
  devices: string[]
}

const BASE_URL = "http://127.0.0.1:8000"

export default function MediaPage() {
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeviceConnected, setIsDeviceConnected] = useState(false)
  const [reportLimit, setReportLimit] = useState(100)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  useEffect(() => {
    const checkDeviceAndFetchFiles = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get<DevicesResponse>(`${BASE_URL}/`)
        const isConnected = response.data.devices.length > 0
        setIsDeviceConnected(isConnected)

        if (isConnected) {
          const filesResponse = await axios.get(`${BASE_URL}/files`)
          setFileData(filesResponse.data)
        }
      } catch (error) {
        console.error("Error checking device connection or fetching files:", error)
        setIsDeviceConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkDeviceAndFetchFiles()
  }, [])

  const renderRow =
    (items: FileItem[]) =>
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index]
      const downloadUrl = `${BASE_URL}${item.url}`

      return (
        <div style={style} className="flex items-center p-2 hover:bg-accent">
          <a href={downloadUrl} download={item.name} className="text-blue-600 hover:underline">
            {item.name}
          </a>
        </div>
      )
    }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      await axios.post(`${BASE_URL}/report/generate/camera`, null, {
        params: { limit: reportLimit },
      })
      setReportGenerated(true)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDownloadReport = () => {
    window.open(`${BASE_URL}/report/download`, "_blank")
  }

  if (isLoading) {
    return <div className="p-4">Loading files...</div>
  }

  if (!isDeviceConnected) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No device connected. Please connect a device to view media files.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!fileData) {
    return <div className="p-4">No file data available.</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Media Files</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Camera Report</h2>
        <div className="flex items-end gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="reportLimit">Number of photos</Label>
            <Input
              type="number"
              id="reportLimit"
              value={reportLimit}
              onChange={(e) => setReportLimit(Number(e.target.value))}
              min={1}
            />
          </div>
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
            <Camera className="mr-2 h-4 w-4" />
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
          {reportGenerated && (
            <Button onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="photos">
          <AccordionTrigger>Photos ({fileData.photos.length} items)</AccordionTrigger>
          <AccordionContent>
            <AutoSizer disableHeight>
              {({ width }) => (
                <List height={300} itemCount={fileData.photos.length} itemSize={35} width={width}>
                  {renderRow(fileData.photos)}
                </List>
              )}
            </AutoSizer>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="videos">
          <AccordionTrigger>Videos ({fileData.videos.length} items)</AccordionTrigger>
          <AccordionContent>
            <AutoSizer disableHeight>
              {({ width }) => (
                <List height={300} itemCount={fileData.videos.length} itemSize={35} width={width}>
                  {renderRow(fileData.videos)}
                </List>
              )}
            </AutoSizer>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="documents">
          <AccordionTrigger>Documents ({fileData.documents.length} items)</AccordionTrigger>
          <AccordionContent>
            <AutoSizer disableHeight>
              {({ width }) => (
                <List height={300} itemCount={fileData.documents.length} itemSize={35} width={width}>
                  {renderRow(fileData.documents)}
                </List>
              )}
            </AutoSizer>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="others">
          <AccordionTrigger>Others ({fileData.others.length} items)</AccordionTrigger>
          <AccordionContent>
            <AutoSizer disableHeight>
              {({ width }) => (
                <List height={300} itemCount={fileData.others.length} itemSize={35} width={width}>
                  {renderRow(fileData.others)}
                </List>
              )}
            </AutoSizer>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

