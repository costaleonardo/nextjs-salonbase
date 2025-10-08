"use client"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { updateAppointment } from "@/app/actions/appointments"
import type { Appointment, Service } from "@prisma/client"

type AppointmentWithService = Appointment & {
  service: Service
  staff: {
    name: string | null
  }
}

interface RescheduleAppointmentModalProps {
  appointment: AppointmentWithService
  isOpen: boolean
  onClose: () => void
}

export function RescheduleAppointmentModal({
  appointment,
  isOpen,
  onClose,
}: RescheduleAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"))
  const [newTime, setNewTime] = useState("09:00")

  if (!isOpen) return null

  const handleReschedule = async () => {
    try {
      setLoading(true)
      setError(null)

      // Combine date and time
      const newDateTime = new Date(`${newDate}T${newTime}`)

      // Validate future date
      if (newDateTime <= new Date()) {
        setError("Please select a future date and time")
        return
      }

      const result = await updateAppointment({
        id: appointment.id,
        datetime: newDateTime,
      })

      if (!result.success) {
        setError(result.error || "Failed to reschedule appointment")
        return
      }

      // Success - refresh the page to show updated data
      window.location.reload()
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Reschedule Appointment
        </h2>

        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <p className="font-medium text-gray-900">{appointment.service.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            Current: {format(appointment.datetime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
          {appointment.staff.name && (
            <p className="mt-1 text-sm text-gray-600">
              With {appointment.staff.name}
            </p>
          )}
        </div>

        <div className="mb-4 space-y-4">
          <div>
            <label
              htmlFor="new-date"
              className="block text-sm font-medium text-gray-700"
            >
              New Date
            </label>
            <input
              type="date"
              id="new-date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="new-time"
              className="block text-sm font-medium text-gray-700"
            >
              New Time
            </label>
            <input
              type="time"
              id="new-time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              step="900" // 15 minute intervals
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The salon will be notified of your reschedule request.
            You may be contacted to confirm the new time is available.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Rescheduling..." : "Reschedule"}
          </button>
        </div>
      </div>
    </div>
  )
}
