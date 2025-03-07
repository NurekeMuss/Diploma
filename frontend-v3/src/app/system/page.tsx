"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Smartphone,
  Battery,
  HardDrive,
  MapPin,
  AlertCircle,
  Loader2,
  Info,
  Cpu,
  BarChart3,
  Gauge,
  Wifi,
  Signal,
  AppWindow,
  Search,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://127.0.0.1:8000"

interface SystemInfo {
  device_name: string
  android_version: string
  battery: string
  storage: string
  gps_coordinates:
    | {
        latitude: string
        longitude: string
      }
    | string
  wifi_connections: string
  ip_address: string
  mobile_operator: string
  network_status: string
  installed_apps: string
}

export default function SystemPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number>(0)
  const [batteryStatus, setBatteryStatus] = useState<string>("Unknown")
  const [storageInfo, setStorageInfo] = useState<{
    total: string
    used: string
    available: string
    usedPercentage: number
  } | null>(null)
  const [wifiInfo, setWifiInfo] = useState<{
    ssid: string
    signalStrength: string
    linkSpeed: string
    frequency: string
  } | null>(null)
  const [networkInfo, setNetworkInfo] = useState<{
    ipAddress: string
    mobileOperator: string
    networkType: string
    signalStrength: string
  } | null>(null)
  const [installedApps, setInstalledApps] = useState<string[]>([])

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await axios.get<SystemInfo>(`${BASE_URL}/system-info`)
        setSystemInfo(response.data)

        // Parse battery information
        parseBatteryInfo(response.data.battery)

        // Parse storage information
        parseStorageInfo(response.data.storage)

        // Parse WiFi information
        parseWifiInfo(response.data.wifi_connections)

        // Parse network information
        parseNetworkInfo(response.data.ip_address, response.data.mobile_operator, response.data.network_status)

        // Parse installed apps
        parseInstalledApps(response.data.installed_apps)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching system info:", error)
        setError("Failed to fetch system information. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchSystemInfo()
  }, [])

  const parseBatteryInfo = (batteryData: string) => {
    // Extract battery level
    const levelMatch = batteryData.match(/level: (\d+)/)
    if (levelMatch && levelMatch[1]) {
      setBatteryLevel(Number.parseInt(levelMatch[1]))
    }

    // Extract battery status
    const statusMatch = batteryData.match(/status: (\d+)/)
    if (statusMatch && statusMatch[1]) {
      const status = Number.parseInt(statusMatch[1])
      switch (status) {
        case 2:
          setBatteryStatus("Charging")
          break
        case 3:
          setBatteryStatus("Discharging")
          break
        case 4:
          setBatteryStatus("Not charging")
          break
        case 5:
          setBatteryStatus("Full")
          break
        default:
          setBatteryStatus("Unknown")
      }
    }
  }

  const parseStorageInfo = (storageData: string) => {
    // Example format: Filesystem     1K-blocks    Used Available Use% Mounted on
    //                 /dev/block/dm-0  59762708 9226312 50536396  16% /data
    const lines = storageData.split("\n").filter((line) => line.trim() !== "")

    if (lines.length >= 2) {
      const dataLine = lines[1]
      const parts = dataLine.split(/\s+/).filter((part) => part !== "")

      if (parts.length >= 5) {
        const total = parts[1]
        const used = parts[2]
        const available = parts[3]
        const usedPercentage = Number.parseInt(parts[4].replace("%", ""))

        setStorageInfo({
          total: formatStorage(Number.parseInt(total)),
          used: formatStorage(Number.parseInt(used)),
          available: formatStorage(Number.parseInt(available)),
          usedPercentage,
        })
      }
    }
  }

  const parseWifiInfo = (wifiData: string) => {
    // Extract SSID
    const ssidMatch = wifiData.match(/SSID: (.*?)(?:,|\n)/i)
    const ssid = ssidMatch ? ssidMatch[1].trim() : "Unknown"

    // Extract signal strength
    const signalMatch = wifiData.match(/RSSI: (-?\d+)/i)
    const signalStrength = signalMatch ? `${signalMatch[1]} dBm` : "Unknown"

    // Extract link speed
    const linkSpeedMatch = wifiData.match(/Link speed: (\d+)/i)
    const linkSpeed = linkSpeedMatch ? `${linkSpeedMatch[1]} Mbps` : "Unknown"

    // Extract frequency
    const frequencyMatch = wifiData.match(/Frequency: ([\d.]+)/i)
    const frequency = frequencyMatch ? `${frequencyMatch[1]} GHz` : "Unknown"

    setWifiInfo({
      ssid,
      signalStrength,
      linkSpeed,
      frequency,
    })
  }

  const parseNetworkInfo = (ipData: string, operatorData: string, networkStatusData: string) => {
    // Extract IP address
    const ipMatch = ipData.match(/inet ([\d.]+)/i)
    const ipAddress = ipMatch ? ipMatch[1] : "Unknown"

    // Get mobile operator
    const mobileOperator = operatorData.trim() || "Unknown"

    // Extract network type
    const networkTypeMatch = networkStatusData.match(/mDataConnectionState=(\d+)/i)
    let networkType = "Unknown"
    if (networkTypeMatch) {
      const state = Number.parseInt(networkTypeMatch[1])
      networkType = state === 0 ? "Disconnected" : state === 1 ? "Connected" : state === 2 ? "Suspended" : "Unknown"
    }

    // Extract signal strength
    const signalMatch = networkStatusData.match(/mSignalStrength=(\d+)/i)
    const signalStrength = signalMatch ? `${signalMatch[1]}%` : "Unknown"

    setNetworkInfo({
      ipAddress,
      mobileOperator,
      networkType,
      signalStrength,
    })
  }

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
  }

  const formatStorage = (kbValue: number): string => {
    if (kbValue >= 1024 * 1024) {
      return `${(kbValue / (1024 * 1024)).toFixed(2)} GB`
    } else if (kbValue >= 1024) {
      return `${(kbValue / 1024).toFixed(2)} MB`
    } else {
      return `${kbValue} KB`
    }
  }

  const getBatteryColor = (level: number): string => {
    if (level <= 20) return "text-red-500"
    if (level <= 50) return "text-orange-500"
    return "text-green-500"
  }

  const getMapUrl = () => {
    if (!systemInfo || typeof systemInfo.gps_coordinates === "string") {
      return null
    }

    const { latitude, longitude } = systemInfo.gps_coordinates
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Number.parseFloat(longitude) - 0.01},${Number.parseFloat(latitude) - 0.01},${Number.parseFloat(longitude) + 0.01},${Number.parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
  }

  const openInGoogleMaps = () => {
    if (!systemInfo || typeof systemInfo.gps_coordinates === "string") {
      return
    }

    const { latitude, longitude } = systemInfo.gps_coordinates
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading system information...</p>
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
              <Info className="mr-2 h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Unable to load system information. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!systemInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No system information available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF6392] to-[#FF8A5B] text-transparent bg-clip-text">
        System Information
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Information Card */}
        <Card className="shadow-md border-[#FF6392]/20">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <Smartphone className="mr-2 h-5 w-5 text-primary" />
              Device Information
            </CardTitle>
            <CardDescription>Basic information about the connected device</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white">
                <Smartphone className="h-12 w-12" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Device Name</p>
                <p className="font-medium text-lg">{systemInfo.device_name}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Android Version</p>
                <p className="font-medium text-lg">{systemInfo.android_version}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Information Card */}
        <Card className="shadow-md border-[#FF6392]/20">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <Battery className="mr-2 h-5 w-5 text-primary" />
              Battery Status
            </CardTitle>
            <CardDescription>Current battery level and charging status</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <Gauge className={`h-24 w-24 ${getBatteryColor(batteryLevel)}`} />
              <div className="text-center mt-2">
                <p className={`text-3xl font-bold ${getBatteryColor(batteryLevel)}`}>{batteryLevel}%</p>
                <Badge
                  variant="outline"
                  className={`mt-2 ${
                    batteryStatus === "Charging"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : batteryStatus === "Full"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}
                >
                  {batteryStatus}
                </Badge>
              </div>
            </div>

            <Progress value={batteryLevel} className="h-3" />

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {batteryLevel <= 20 ? (
                <p className="text-red-500">Battery is low. Please connect charger.</p>
              ) : batteryLevel >= 80 ? (
                <p className="text-green-500">Battery level is good.</p>
              ) : (
                <p>Battery is at moderate level.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage Information Card */}
        <Card className="shadow-md border-[#FF6392]/20">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <HardDrive className="mr-2 h-5 w-5 text-primary" />
              Storage Information
            </CardTitle>
            <CardDescription>Device storage usage and availability</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {storageInfo && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Storage Usage</span>
                  <span className="text-sm font-medium">{storageInfo.usedPercentage}%</span>
                </div>
                <Progress value={storageInfo.usedPercentage} className="h-3 mb-6" />

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">{storageInfo.total}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <Cpu className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <p className="text-xs text-muted-foreground">Used</p>
                    <p className="font-medium">{storageInfo.used}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <HardDrive className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="font-medium">{storageInfo.available}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* WiFi & Network Information Card */}
        <Card className="shadow-md border-[#FF6392]/20">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <Wifi className="mr-2 h-5 w-5 text-primary" />
              Network Information
            </CardTitle>
            <CardDescription>WiFi and mobile network details</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {wifiInfo && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Wifi className="mr-2 h-4 w-4 text-primary" />
                    WiFi Connection
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">SSID</p>
                      <p className="font-medium">{wifiInfo.ssid}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Signal Strength</p>
                      <p className="font-medium">{wifiInfo.signalStrength}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Link Speed</p>
                      <p className="font-medium">{wifiInfo.linkSpeed}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{wifiInfo.frequency}</p>
                    </div>
                  </div>
                </div>
              )}

              {networkInfo && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Signal className="mr-2 h-4 w-4 text-secondary" />
                    Mobile Network
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">IP Address</p>
                      <p className="font-medium">{networkInfo.ipAddress}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Mobile Operator</p>
                      <p className="font-medium">{networkInfo.mobileOperator}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Network Type</p>
                      <p className="font-medium">{networkInfo.networkType}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Signal Strength</p>
                      <p className="font-medium">{networkInfo.signalStrength}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GPS Information Card */}
        <Card className="shadow-md border-[#FF6392]/20">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              GPS Location
            </CardTitle>
            <CardDescription>Current device location coordinates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {typeof systemInfo.gps_coordinates === "string" ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{systemInfo.gps_coordinates}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Latitude</p>
                    <p className="font-medium">{systemInfo.gps_coordinates.latitude}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Longitude</p>
                    <p className="font-medium">{systemInfo.gps_coordinates.longitude}</p>
                  </div>
                </div>

                <div className="rounded-lg overflow-hidden border border-[#FF6392]/20 h-[200px] mb-4">
                  {getMapUrl() && (
                    <iframe
                      src={getMapUrl()!}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      title="Device Location"
                    ></iframe>
                  )}
                </div>

                <Button onClick={openInGoogleMaps} className="w-full" variant="outline">
                  <MapPin className="mr-2 h-4 w-4" />
                  Open in Google Maps
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Installed Apps Card */}
        <Card className="shadow-md border-[#FF6392]/20 md:col-span-2">
          <CardHeader className="bg-card">
            <CardTitle className="flex items-center text-xl text-primary">
              <AppWindow className="mr-2 h-5 w-5 text-primary" />
              Installed Applications
            </CardTitle>
            <CardDescription>List of applications installed on the device</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">Total Apps: {installedApps.length}</p>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  className="pl-8 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase()
                    if (searchTerm === "") {
                      parseInstalledApps(systemInfo.installed_apps)
                    } else {
                      const filtered = systemInfo.installed_apps
                        .split("\n")
                        .filter((line) => line.toLowerCase().includes(searchTerm))
                        .join("\n")
                      parseInstalledApps(filtered)
                    }
                  }}
                />
              </div>
            </div>

            <div className="border rounded-md h-[300px] overflow-y-auto">
              {installedApps.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                  {installedApps.map((app, index) => (
                    <div key={index} className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6392] to-[#FF8A5B] flex items-center justify-center text-white mr-2">
                        <AppWindow className="h-4 w-4" />
                      </div>
                      <span className="text-sm truncate" title={app}>
                        {app}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

