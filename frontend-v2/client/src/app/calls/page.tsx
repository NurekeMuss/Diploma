"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { AlertCircle, Loader2, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://127.0.0.1:8000"

interface CallLog {
  "ID звонка": string
  Номер: string
  Контакт: string
  Длительность: string
  Страна: string
  "Тип вызова": string
  Дата: string
  "Новый вызов": string
  Пропущенный: string
  "SIM-карта (ID)": string
  "Причина блокировки": string
  "Учётная запись телефона": string
}

interface CallLogsResponse {
  call_logs: CallLog[]
}

export default function CallsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        const response = await axios.get<CallLogsResponse>(`${BASE_URL}/call_logs`)
        setCallLogs(response.data.call_logs)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching call logs:", error)
        setError("Failed to fetch call logs. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchCallLogs()
  }, [])

  const getCallIcon = (type: string) => {
    switch (type) {
      case "Входящий":
        return <PhoneIncoming className="h-4 w-4 text-green-500" />
      case "Исходящий":
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
      case "Пропущенный":
        return <PhoneMissed className="h-4 w-4 text-red-500" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case "Входящий":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <PhoneIncoming className="h-3 w-3 mr-1" /> Incoming
          </Badge>
        )
      case "Исходящий":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <PhoneOutgoing className="h-3 w-3 mr-1" /> Outgoing
          </Badge>
        )
      case "Пропущенный":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <PhoneMissed className="h-3 w-3 mr-1" /> Missed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Phone className="h-3 w-3 mr-1" /> {type}
          </Badge>
        )
    }
  }

  const filteredCallLogs = useMemo(() => {
    let filtered = callLogs

    // Filter by phone number or contact
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log["Номер"].toLowerCase().includes(searchTermLower) ||
          (log["Контакт"] && log["Контакт"].toLowerCase().includes(searchTermLower)),
      )
    }

    // Filter by start date
    if (startDate) {
      const startDateTime = new Date(startDate).getTime()
      filtered = filtered.filter((log) => {
        const callDate = new Date(log["Дата"]).getTime()
        return callDate >= startDateTime
      })
    }

    // Filter by end date
    if (endDate) {
      const endDateTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) // End of the selected day
      filtered = filtered.filter((log) => {
        const callDate = new Date(log["Дата"]).getTime()
        return callDate <= endDateTime
      })
    }

    return filtered
  }, [callLogs, searchTerm, startDate, endDate])

  const clearFilters = () => {
    setSearchTerm("")
    setStartDate("")
    setEndDate("")
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading call logs...</p>
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
              <Phone className="mr-2 h-5 w-5" />
              Call Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Unable to load call logs. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Call Logs</h1>

      <Card className="shadow-md border-border mb-6">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <Phone className="mr-2 h-5 w-5" />
            Filter Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by phone number or contact name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <Calendar className="inline-block h-4 w-4 mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <Calendar className="inline-block h-4 w-4 mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-border">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <Phone className="mr-2 h-5 w-5" />
            Recent Calls
            {(searchTerm || startDate || endDate) && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filteredCallLogs.length} results found
                {startDate && ` from ${new Date(startDate).toLocaleDateString()}`}
                {endDate && ` to ${new Date(endDate).toLocaleDateString()}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCallLogs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No matching call logs found" : "No call logs found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallLogs.map((log) => (
                  <TableRow key={log["ID звонка"]}>
                    <TableCell>{getCallTypeLabel(log["Тип вызова"])}</TableCell>
                    <TableCell className="font-medium">{log["Номер"]}</TableCell>
                    <TableCell>{log["Контакт"] || "Unknown"}</TableCell>
                    <TableCell>{log["Длительность"]}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(log["Дата"]).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

