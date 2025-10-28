'use client'

import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SimpleDatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SimpleDatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(date ? date.getMonth() : new Date().getMonth())
  const [year, setYear] = React.useState(date ? date.getFullYear() : new Date().getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const today = new Date()
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(year, month, day)
    onDateChange?.(selectedDate)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange?.(undefined)
  }

  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year
  }

  const isSelected = (day: number) => {
    return date && 
           date.getDate() === day && 
           date.getMonth() === month && 
           date.getFullYear() === year
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10 relative',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
          {date && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 h-6 w-6 p-0 hover:bg-muted"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 0) {
                  setMonth(11)
                  setYear(year - 1)
                } else {
                  setMonth(month - 1)
                }
              }}
            >
              ←
            </Button>
            
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                {monthNames.map((name, index) => (
                  <option key={index} value={index}>{name}</option>
                ))}
              </select>
              
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-20 text-sm"
                min="1900"
                max="2100"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (month === 11) {
                  setMonth(0)
                  setYear(year + 1)
                } else {
                  setMonth(month + 1)
                }
              }}
            >
              →
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              return (
                <Button
                  key={day}
                  variant={isSelected(day) ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 font-normal",
                    isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
                    isSelected(day) && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleDateSelect(day)}
                >
                  {day}
                </Button>
              )
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-between mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                setMonth(today.getMonth())
                setYear(today.getFullYear())
                onDateChange?.(today)
                setOpen(false)
              }}
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDateChange?.(undefined)
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}