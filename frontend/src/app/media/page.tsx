"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  useEffect(() => {
    const checkDeviceConnection = async () => {
      try {
        const response = await axios.get<DevicesResponse>(`${BASE_URL}/`)
        setIsDeviceConnected(response.data.devices.length > 0)
        return response.data.devices.length > 0
      } catch (error) {
        console.error("Error checking device connection:", error)
        setIsDeviceConnected(false)
        return false
      }
    }

    const fetchFiles = async () => {
      try {
        const deviceConnected = await checkDeviceConnection()
        if (!deviceConnected) {
          setIsLoading(false)
          return
        }

        const response = await axios.get(`${BASE_URL}/files`)
        setFileData(response.data)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching files:", error)
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchFiles()

    // Set up polling for device connection
    const pollInterval = setInterval(async () => {
      const deviceConnected = await checkDeviceConnection()
      if (deviceConnected && !fileData) {
        fetchFiles()
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [fileData])

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

