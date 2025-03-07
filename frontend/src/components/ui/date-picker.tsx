"use client"

import { useState } from "react"

interface DatePickerProps {
  selected: string | null
  onChange: (date: string | null) => void
  placeholder?: string
}

export function DatePicker({ selected, onChange, placeholder = "Select date" }: DatePickerProps) {
  return (
    <input
      type="date"
      value={selected || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="border border-gray-300 rounded px-3 py-2 w-[200px]"
      placeholder={placeholder}
    />
  )
}
