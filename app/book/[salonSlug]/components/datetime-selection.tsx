'use client'

import { useState, useEffect } from 'react'
import { getAvailableTimeSlots } from '@/app/actions/public-bookings'

type DateTimeSelectionProps = {
  salonId: string
  staffId: string
  serviceId: string
  selectedDatetime?: string
  onSelect: (datetime: string) => void
  onBack: () => void
}

export function DateTimeSelection({
  salonId,
  staffId,
  serviceId,
  selectedDatetime,
  onSelect,
  onBack,
}: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (selectedDatetime) {
      return new Date(selectedDatetime)
    }
    return new Date()
  })
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  // Fetch available time slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true)
      setError(null)

      const result = await getAvailableTimeSlots({
        salonId,
        staffId,
        serviceId,
        date: selectedDate,
      })

      if (result.success) {
        setAvailableSlots(result.data)
      } else {
        setError(result.error)
      }

      setIsLoading(false)
    }

    fetchSlots()
  }, [salonId, staffId, serviceId, selectedDate])

  const formatDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    if (targetDate.getTime() === today.getTime()) {
      return 'Today'
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Select Date & Time</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          ← Back
        </button>
      </div>

      {/* Date Selection - Horizontal Scroll */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Date</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {availableDates.map((date, index) => {
            const isSelected = isSameDay(date, selectedDate)
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
                style={{ minWidth: '80px', minHeight: '44px' }}
              >
                <div className="text-center">
                  <div className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      isSelected ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {formatDate(date)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Time</h3>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Loading available times...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!isLoading && !error && availableSlots.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No available time slots for this date.</p>
            <p className="text-sm text-gray-400 mt-1">Please select a different date.</p>
          </div>
        )}

        {!isLoading && !error && availableSlots.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {availableSlots.map((slot) => {
              const isSelected = selectedDatetime === slot
              return (
                <button
                  key={slot}
                  onClick={() => onSelect(slot)}
                  className={`px-3 py-3 rounded-lg border-2 transition-all hover:border-blue-500 active:scale-95 text-sm font-medium ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-blue-50'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {formatTime(slot)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
