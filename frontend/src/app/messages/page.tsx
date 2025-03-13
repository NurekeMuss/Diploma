"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Smartphone,
  FileText,
  Search,
  CalendarDays,
  Filter,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const BASE_URL = "http://127.0.0.1:8000"

interface SmsMessage {
  ID: string
  Номер: string
  Текст: string
  Дата: string
  Тип: string
}

interface SmsResponse {
  sms_messages: SmsMessage[]
  error?: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [filteredMessages, setFilteredMessages] = useState<SmsMessage[]>([])
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get<SmsResponse>(`${BASE_URL}/sms`)

        // Check if the response contains an error field indicating device not connected
        if (response.data && response.data.error) {
          setError("Device not connected. Please connect your device and try again.")
          setIsLoading(false)
          return
        }

        setMessages(response.data.sms_messages)
        setFilteredMessages(response.data.sms_messages)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching messages:", error)

        // Check if the error is related to device connection
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.status === 404 || error.response.status === 503) {
            setError("Device not connected. Please connect your device and try again.")
          } else {
            setError("Failed to fetch messages. Please try again later.")
          }
        } else {
          setError("Device not connected or server is unavailable. Please check your connections.")
        }

        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  useEffect(() => {
    // Filter messages based on search term and date
    const filtered = messages.filter((message) => {
      const matchesSearch =
        searchTerm === "" ||
        message["Номер"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        message["Текст"].toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDate = dateFilter === "" || new Date(message["Дата"]).toISOString().split("T")[0] === dateFilter

      return matchesSearch && matchesDate
    })

    setFilteredMessages(filtered)
  }, [messages, searchTerm, dateFilter])

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "Входящее":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "Исходящее":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case "Входящее":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ArrowDownLeft className="h-3 w-3 mr-1" /> Incoming
          </Badge>
        )
      case "Исходящее":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ArrowUpRight className="h-3 w-3 mr-1" /> Outgoing
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <MessageSquare className="h-3 w-3 mr-1" /> {type}
          </Badge>
        )
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter("")
  }

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true)
      setReportError(null)

      // Prepare query parameters based on filters
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("contact", searchTerm)
      }
      if (dateFilter) {
        params.append("date", dateFilter)
      }

      // Call the API endpoint with query parameters
      const response = await axios.get(`${BASE_URL}/report/messages`, {
        params,
        responseType: "blob",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      })

      // Create and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "messages_report.pdf")

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating report:", error)
      setReportError("Failed to generate report. Please try again.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
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
              <MessageSquare className="mr-2 h-5 w-5" />
              Messages
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
                <p className="text-muted-foreground">Unable to load messages. Please try again later.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Messages</h1>

      <Card className="shadow-md border-border mb-6">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filter Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone number or message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <CalendarDays className="inline-block h-4 w-4 mr-1 text-secondary" />
                Filter by Date
              </label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear Filters
              </Button>
              <Button
                onClick={generateReport}
                className="flex-1"
                disabled={isGeneratingReport || filteredMessages.length === 0}
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

      <Card className="shadow-md border-border">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <MessageSquare className="mr-2 h-5 w-5" />
            SMS Messages
            {(searchTerm || dateFilter) && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {filteredMessages.length} results found
                {dateFilter && ` for ${dateFilter}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMessages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm || dateFilter ? "No matching messages found" : "No messages found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[150px]">Number</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead className="w-[200px]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow
                    key={message["ID"]}
                    className="cursor-pointer hover:bg-accent/20"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <TableCell>{getMessageTypeLabel(message["Тип"])}</TableCell>
                    <TableCell className="font-medium">{message["Номер"]}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-2 text-muted-foreground">{message["Текст"]}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(message["Дата"]).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              {selectedMessage && (
                <>
                  {getMessageIcon(selectedMessage["Тип"])}
                  Message Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="grid gap-6 pt-2">
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <div className="font-medium text-muted-foreground">Type:</div>
                <div>{getMessageTypeLabel(selectedMessage["Тип"])}</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <div className="font-medium text-muted-foreground">Number:</div>
                <div className="font-medium">{selectedMessage["Номер"]}</div>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                <div className="font-medium text-muted-foreground">Text:</div>
                <ScrollArea className="h-[200px] w-full rounded-md border border-border bg-muted/10 p-4">
                  {selectedMessage["Текст"]}
                </ScrollArea>
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <div className="font-medium text-muted-foreground">Date:</div>
                <div>{new Date(selectedMessage["Дата"]).toLocaleString()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

