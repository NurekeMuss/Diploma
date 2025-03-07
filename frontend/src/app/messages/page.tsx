"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Loader2, MessageSquare, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"

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
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null)
  const [contactFilter, setContactFilter] = useState("")
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get<SmsResponse>(`${BASE_URL}/sms`)
        setMessages(response.data.sms_messages)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching messages:", error)
        setError("Failed to fetch messages. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [])

  const filteredMessages = messages.filter((message) => {
    return (
      (!contactFilter || message.Номер.includes(contactFilter)) &&
      (!dateFilter || message.Дата.startsWith(dateFilter))
    )
  })

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Messages</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by contact"
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-[200px]"
        />
        <DatePicker selected={dateFilter} onChange={setDateFilter} placeholder="Filter by date" />
      </div>

      <Card className="shadow-md border-border">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <MessageSquare className="mr-2 h-5 w-5" />
            SMS Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredMessages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No messages found</p>
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
                    key={message.ID}
                    className="cursor-pointer hover:bg-accent/20"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <TableCell>{message.Тип}</TableCell>
                    <TableCell className="font-medium">{message.Номер}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-2 text-muted-foreground">{message.Текст}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(message.Дата).toLocaleString()}
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
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="grid gap-6 pt-2">
              <div><strong>Type:</strong> {selectedMessage.Тип}</div>
              <div><strong>Number:</strong> {selectedMessage.Номер}</div>
              <div><strong>Text:</strong>
                <ScrollArea className="h-[200px] w-full rounded-md border border-border bg-muted/10 p-4">
                  {selectedMessage.Текст}
                </ScrollArea>
              </div>
              <div><strong>Date:</strong> {new Date(selectedMessage.Дата).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
