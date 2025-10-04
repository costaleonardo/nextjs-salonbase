'use client'

import { Appointment } from '../appointments-view'

type AppointmentCardProps = {
  appointment: Appointment
  onClick: () => void
  compact?: boolean
}

export function AppointmentCard({ appointment, onClick, compact = false }: AppointmentCardProps) {
  const statusColors = {
    SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const statusColor = statusColors[appointment.status as keyof typeof statusColors] || statusColors.SCHEDULED

  const startTime = appointment.datetime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const endTime = new Date(
    appointment.datetime.getTime() + appointment.service.duration * 60000
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-2 rounded border ${statusColor} hover:shadow-md transition-shadow`}
      >
        <div className="text-xs font-semibold">{startTime}</div>
        <div className="text-sm font-medium truncate">{appointment.client.name}</div>
        <div className="text-xs text-gray-600 truncate">{appointment.service.name}</div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border ${statusColor} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">
              {startTime} - {endTime}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-current">
              {appointment.status}
            </span>
          </div>

          <div className="text-base font-semibold text-gray-900 mb-1">
            {appointment.client.name}
          </div>

          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">{appointment.service.name}</span>
            <span className="text-gray-500"> • {appointment.service.duration} min</span>
            <span className="text-gray-500"> • ${appointment.service.price.toString()}</span>
          </div>

          <div className="text-sm text-gray-600">
            with {appointment.staff.name}
          </div>

          {appointment.client.phone && (
            <div className="text-sm text-gray-500 mt-1">
              {appointment.client.phone}
            </div>
          )}

          {appointment.notes && (
            <div className="text-sm text-gray-600 mt-2 italic">
              Note: {appointment.notes}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
