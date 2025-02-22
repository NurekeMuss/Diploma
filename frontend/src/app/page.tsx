"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function Home() {
  const [devices, setDevices] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/")
        setDevices(response.data.devices)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching devices:", error)
        setIsLoading(false)
      }
    }

    const pollInterval = setInterval(fetchDevices, 5000) // Poll every 5 seconds

    fetchDevices() // Initial fetch

    return () => clearInterval(pollInterval)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Connected Devices</h1>
      {isLoading ? (
        <p>Loading devices...</p>
      ) : devices.length > 0 ? (
        <ul>
          {devices.map((device, index) => (
            <li key={index} className="mb-2">
              {device}
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices connected. Please connect a device.</p>
      )}
    </div>
  )
}

