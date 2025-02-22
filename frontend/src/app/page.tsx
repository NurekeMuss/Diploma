"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Smartphone, XCircle } from "lucide-react"
import { Steps, Step, StepDescription, StepTitle } from "@/components/ui/steps"

const BASE_URL = "http://127.0.0.1:8000"

export default function Home() {
  const [devices, setDevices] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/`)
        setDevices(response.data.devices)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching devices:", error)
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Device Connection</h1>

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

      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            {isLoading
              ? "Checking for connected devices..."
              : devices.length > 0
                ? "The following devices are connected:"
                : "No devices are currently connected."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : devices.length > 0 ? (
            <ul className="space-y-2">
              {devices.map((device, index) => (
                <li key={index} className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-primary" />
                  <span>{device}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertTitle>No devices connected</AlertTitle>
              <AlertDescription>Please follow the instructions above to connect a device.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

