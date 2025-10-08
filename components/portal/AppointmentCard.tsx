"use client"

import { format } from "date-fns"
import type { Appointment, Service, Payment } from "@prisma/client"

type AppointmentWithRelations = Appointment & {
  service: Service
  staff: {
    name: string | null
    email: string | null
  }
  payment: Payment | null
}

interface AppointmentCardProps {
  appointment: AppointmentWithRelations
  isPast?: boolean
  onCancel?: (appointment: AppointmentWithRelations) => void
  onReschedule?: (appointment: AppointmentWithRelations) => void
}

const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
}

export function AppointmentCard({
  appointment,
  isPast = false,
  onCancel,
  onReschedule,
}: AppointmentCardProps) {
  const canModify = appointment.status === "SCHEDULED" && !isPast
  const hoursUntilAppointment = (appointment.datetime.getTime() - Date.now()) / (1000 * 60 * 60)

  // Cancellation policy: can't cancel within 24 hours
  const canCancel = canModify && hoursUntilAppointment > 24

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {appointment.service.name}
            </h3>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[appointment.status]
              }`}
            >
              {appointment.status}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">
                {format(appointment.datetime, "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {format(appointment.datetime, "h:mm a")} ({appointment.service.duration} min)
              </span>
            </div>

            {appointment.staff.name && (
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>With {appointment.staff.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">${appointment.service.price.toFixed(2)}</span>
              {appointment.payment && (
                <span className="ml-2 text-green-600">
                  ({appointment.payment.status === "COMPLETED" ? "Paid" : "Payment Pending"})
                </span>
              )}
            </div>
          </div>

          {appointment.notes && (
            <div className="mt-3 rounded-md bg-gray-50 p-3">
              <p className="text-sm text-gray-600">{appointment.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canModify && (
        <div className="mt-4 flex gap-3">
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(appointment)}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel Appointment
            </button>
          )}
          {!canCancel && hoursUntilAppointment > 0 && (
            <p className="text-sm text-red-600">
              Cancellations must be made at least 24 hours in advance
            </p>
          )}
          {onReschedule && (
            <button
              onClick={() => onReschedule(appointment)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reschedule
            </button>
          )}
        </div>
      )}
    </div>
  )
}
