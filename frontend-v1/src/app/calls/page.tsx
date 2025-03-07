"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AlertCircle, Loader2, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
            <Phone className="mr-2 h-5 w-5" />
            Call Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callLogs.map((log) => (
                <TableRow key={log["ID звонка"]}>
                  <TableCell>{getCallIcon(log["Тип вызова"])}</TableCell>
                  <TableCell>{log["Номер"]}</TableCell>
                  <TableCell>{log["Контакт"]}</TableCell>
                  <TableCell>{log["Длительность"]}</TableCell>
                  <TableCell>{new Date(log["Дата"]).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

