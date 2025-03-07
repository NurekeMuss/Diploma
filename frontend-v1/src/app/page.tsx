"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Smartphone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Step, StepDescription, Steps, StepTitle } from "@/components/ui/steps"

const BASE_URL = "http://127.0.0.1:8000"

interface DeviceInfo {
  serial_number: string
  brand: string
  device: string
  model: string
}

interface DevicesResponse {
  "device-info": DeviceInfo[]
}

export default function Home() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get<DevicesResponse>(`${BASE_URL}/`)
        setDevices(response.data["device-info"])
        setIsLoading(false)
        setError(null)
      } catch (error) {
        console.error("Error fetching devices:", error)
        setIsLoading(false)
        setError("Failed to fetch devices. Please check your connection.")
      }
    }

    const pollInterval = setInterval(fetchDevices, 5000) // Poll every 5 seconds

    fetchDevices() // Initial fetch

    return () => clearInterval(pollInterval)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Connected Devices</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Connect Your Device</CardTitle>
          <CardDescription>Follow these steps to connect your device:</CardDescription>
        </CardHeader>
        <CardContent>
          <Steps>
            <Step>
              <StepTitle>Enable USB Debugging</StepTitle>
              <StepDescription>
                Go to your phone&apos;s Settings, find Developer options, and enable USB Debugging.
              </StepDescription>
            </Step>
            <Step>
              <StepTitle>Connect via USB</StepTitle>
              <StepDescription>Connect your phone to this computer using a USB cable.</StepDescription>
            </Step>
            <Step>
              <StepTitle>Allow USB Debugging</StepTitle>
              <StepDescription>
                On your phone, tap &quot;Allow&quot; when prompted to allow USB debugging.
              </StepDescription>
            </Step>
          </Steps>
        </CardContent>
      </Card>

      {isLoading ? (
        <p>Loading devices...</p>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : devices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  {device.brand} {device.model}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Serial Number:</strong> {device.serial_number}
                </p>
                <p>
                  <strong>Device:</strong> {device.device}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No devices connected. Please connect a device.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

