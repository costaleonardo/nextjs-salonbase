"use client"

import { useState } from "react"
import { format } from "date-fns"
import { cancelAppointment } from "@/app/actions/appointments"
import type { Appointment, Service } from "@prisma/client"

type AppointmentWithService = Appointment & {
  service: Service
}

interface CancelAppointmentModalProps {
  appointment: AppointmentWithService
  isOpen: boolean
  onClose: () => void
}

export function CancelAppointmentModal({
  appointment,
  isOpen,
  onClose,
}: CancelAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  if (!isOpen) return null

  const handleCancel = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await cancelAppointment(appointment.id)

      if (!result.success) {
        setError(result.error || "Failed to cancel appointment")
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
          Cancel Appointment
        </h2>

        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <p className="font-medium text-gray-900">{appointment.service.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            {format(appointment.datetime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div className="mb-4 rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">
            <strong>Cancellation Policy:</strong> Appointments must be cancelled at least 24
            hours in advance. Late cancellations may be subject to a fee.
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="cancellation-reason"
            className="block text-sm font-medium text-gray-700"
          >
            Reason for cancellation (optional)
          </label>
          <textarea
            id="cancellation-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Let us know why you're cancelling..."
          />
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
            Keep Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Cancel Appointment"}
          </button>
        </div>
      </div>
    </div>
  )
}
