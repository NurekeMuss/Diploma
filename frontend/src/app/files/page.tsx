"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Loader2, FolderHeart, RefreshCw, Smartphone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://127.0.0.1:8000"

interface FilesResponse {
  files?: any[]
  error?: string
}

export default function FilesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])

  useEffect(() => {
    const fetchFilesData = async () => {
      try {
        // This is a placeholder for the actual API endpoint
        // Replace with the actual endpoint when available
        const response = await axios.get<FilesResponse>(`${BASE_URL}/files`)

        // Check if the response contains an error field indicating device not connected
        if (response.data && response.data.error) {
          setError("Device not connected. Please connect your device and try again.")
          setIsLoading(false)
          return
        }

        if (response.data.files) {
          setFiles(response.data.files)
        }
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching files data:", error)

        // Check if the error is related to device connection
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404 || error.response.status === 503) {
            setError("Device not connected. Please connect your device and try again.")
          } else {
            setError("Failed to fetch files data. Please try again later.")
          }
        } else {
          setError("Device not connected or server is unavailable. Please check your connections.")
        }

        setIsLoading(false)
      }
    }

    // Comment out the actual API call for now since the endpoint might not exist yet
    // fetchFilesData()

    // Instead, simulate loading and then show the placeholder
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading files data...</p>
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
              <FolderHeart className="mr-2 h-5 w-5" />
              Files
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
                <p className="text-muted-foreground">Unable to load files data. Please try again later.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <h1 className="mb-6 text-3xl font-bold text-primary">Files</h1>
      <div className="rounded-lg border border-border bg-card p-6 shadow">
        <p className="text-muted-foreground">Your files and documents will appear here.</p>
      </div>
    </div>
  )
}

