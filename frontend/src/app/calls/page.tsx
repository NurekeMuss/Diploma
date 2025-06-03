"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import {
  AlertCircle,
  Loader2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  CalendarDays,
  Filter,
  ListFilter,
  RefreshCw,
  Smartphone,
  FileText,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://127.0.0.1:8000"
const ITEMS_PER_PAGE = 10

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
  error?: string
}

export default function CallsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get<CallLogsResponse>(`${BASE_URL}/call_logs`)

        // Check if the response contains an error field indicating device not connected
        if (response.data && response.data.error) {
          setError("Device not connected. Please connect your device and try again.")
          setIsLoading(false)
          return
        }

        setCallLogs(response.data.call_logs)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching call logs:", error)

        // Check if the error is related to device connection
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404 || error.response.status === 503) {
            setError("Device not connected. Please connect your device and try again.")
          } else {
            setError("Failed to fetch call logs. Please try again later.")
          }
        } else {
          setError("Device not connected or server is unavailable. Please check your connections.")
        }

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
        return <PhoneCall className="h-4 w-4" />
    }
  }

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case "Входящий":
        return (
          <Badge variant="outline" className="bg-[#e6fff0] text-green-700 border-green-200">
            <PhoneIncoming className="h-3 w-3 mr-1" /> Incoming
          </Badge>
        )
      case "Исходящий":
        return (
          <Badge variant="outline" className="bg-[#e6f7ff] text-blue-700 border-blue-200">
            <PhoneOutgoing className="h-3 w-3 mr-1" /> Outgoing
          </Badge>
        )
      case "Пропущенный":
        return (
          <Badge variant="outline" className="bg-[#fff1f0] text-red-700 border-red-200">
            <PhoneMissed className="h-3 w-3 mr-1" /> Missed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <PhoneCall className="h-3 w-3 mr-1" /> {type}
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredCallLogs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCallLogs.length)
  const currentPageData = filteredCallLogs.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, startDate, endDate])

  const clearFilters = () => {
    setSearchTerm("")
    setStartDate("")
    setEndDate("")
  }

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true)

      // Send the filtered call logs to the backend
      const response = await axios.post(`${BASE_URL}/report/calls/from_json`, filteredCallLogs, {
        responseType: "blob",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })

      // Create and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "calls_report.pdf")

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setIsGeneratingReport(false)
    } catch (error) {
      console.error("Error generating report:", error)
      setIsGeneratingReport(false)
      setReportError("Failed to generate report. Please try again.")
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return

    setIsLoadingMore(true)
    // Simulate loading delay for better UX
    setTimeout(() => {
      setCurrentPage(page)
      setIsLoadingMore(false)
    }, 300)
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
              <PhoneCall className="mr-2 h-5 w-5" />
              Call Logs
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
                <p className="text-muted-foreground">Unable to load call logs. Please try again later.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Call Logs</h1>

      <Card className="shadow-md border-[#FF6392]/20 mb-6">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <Filter className="mr-2 h-5 w-5 text-primary" />
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
                <CalendarDays className="inline-block h-4 w-4 mr-1 text-secondary" />
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
                <CalendarDays className="inline-block h-4 w-4 mr-1 text-secondary" />
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear Filters
              </Button>
              <Button
                onClick={generateReport}
                className="flex-1"
                disabled={isGeneratingReport || filteredCallLogs.length === 0}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{reportError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md border-[#FF6392]/20">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <ListFilter className="mr-2 h-5 w-5 text-secondary" />
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
                {searchTerm || startDate || endDate ? "No matching call logs found" : "No call logs found"}
              </p>
            </div>
          ) : (
            <>
              {isLoadingMore ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                    {currentPageData.map((log) => (
                      <TableRow key={log["ID звонка"]}>
                        <TableCell>{getCallTypeLabel(log["Тип вызова"])}</TableCell>
                        <TableCell className="font-medium">{log["Номер"]}</TableCell>
                        <TableCell>{log["Контакт"] || "Unknown"}</TableCell>
                        <TableCell>{log["Длительность"]}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log["Дата"]).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
        {filteredCallLogs.length > 0 && (
          <CardFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{endIndex} of {filteredCallLogs.length} calls
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {/* First page */}
                {currentPage > 2 && (
                  <>
                    <Button
                      variant={1 === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </Button>
                    {currentPage > 3 && <span className="px-2 text-muted-foreground">...</span>}
                  </>
                )}

                {/* Previous page */}
                {currentPage > 1 && (
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)}>
                    {currentPage - 1}
                  </Button>
                )}

                {/* Current page */}
                <Button variant="default" size="sm">
                  {currentPage}
                </Button>

                {/* Next page */}
                {currentPage < totalPages && (
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)}>
                    {currentPage + 1}
                  </Button>
                )}

                {/* Last page */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2 text-muted-foreground">...</span>}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
