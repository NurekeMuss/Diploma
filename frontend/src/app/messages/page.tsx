"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Loader2, MessageSquare, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[150px]">Number</TableHead>
                <TableHead>Text</TableHead>
                <TableHead className="w-[200px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow
                  key={message["ID"]}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMessage(message)}
                >
                  <TableCell className="flex items-center gap-2">
                    {getMessageIcon(message["Тип"])}
                    {message["Тип"]}
                  </TableCell>
                  <TableCell>{message["Номер"]}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="line-clamp-2">{message["Текст"]}</div>
                  </TableCell>
                  <TableCell>{new Date(message["Дата"]).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && (
                <>
                  {getMessageIcon(selectedMessage["Тип"])}
                  Message Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="grid gap-4">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <div className="font-semibold">Type:</div>
                <div>{selectedMessage["Тип"]}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <div className="font-semibold">Number:</div>
                <div>{selectedMessage["Номер"]}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                <div className="font-semibold">Text:</div>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">{selectedMessage["Текст"]}</ScrollArea>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <div className="font-semibold">Date:</div>
                <div>{new Date(selectedMessage["Дата"]).toLocaleString()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

