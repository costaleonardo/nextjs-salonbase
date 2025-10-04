'use client'

import { CalendarView, Appointment } from '../appointments-view'
import { AppointmentCard } from './appointment-card'

type AppointmentCalendarProps = {
  view: CalendarView
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
}

export function AppointmentCalendar({
  view,
  currentDate,
  appointments,
  onAppointmentClick,
}: AppointmentCalendarProps) {
  if (view === 'day') {
    return (
      <DayView
        date={currentDate}
        appointments={appointments}
        onAppointmentClick={onAppointmentClick}
      />
    )
  }

  return (
    <WeekView
      weekStart={currentDate}
      appointments={appointments}
      onAppointmentClick={onAppointmentClick}
    />
  )
}

// ============================================
// Day View Component
// ============================================

function DayView({
  date,
  appointments,
  onAppointmentClick,
}: {
  date: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
}) {
  // Generate time slots from 8 AM to 8 PM (30-minute intervals)
  const startHour = 8
  const endHour = 20
  const intervalMinutes = 30
  const timeSlots: Date[] = []

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const slot = new Date(date)
      slot.setHours(hour, minute, 0, 0)
      timeSlots.push(slot)
    }
  }

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort(
    (a, b) => a.datetime.getTime() - b.datetime.getTime()
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {timeSlots.map((slot, index) => {
          const slotEnd = new Date(slot.getTime() + intervalMinutes * 60000)

          // Find appointments that start in this time slot
          const slotAppointments = sortedAppointments.filter((apt) => {
            return apt.datetime >= slot && apt.datetime < slotEnd
          })

          return (
            <div key={index} className="flex hover:bg-gray-50">
              {/* Time Label */}
              <div className="w-24 flex-shrink-0 p-4 text-sm text-gray-500 border-r border-gray-200">
                {slot.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>

              {/* Appointment Content */}
              <div className="flex-1 p-2 min-h-[60px]">
                {slotAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => onAppointmentClick(appointment)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Show message if no appointments */}
      {appointments.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No appointments scheduled for this day
        </div>
      )}
    </div>
  )
}

// ============================================
// Week View Component
// ============================================

function WeekView({
  weekStart,
  appointments,
  onAppointmentClick,
}: {
  weekStart: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
}) {
  // Generate array of dates for the week (Sunday to Saturday)
  const weekDays: Date[] = []
  const startOfWeek = new Date(weekStart)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  // Group appointments by day
  const appointmentsByDay: Record<string, Appointment[]> = {}
  weekDays.forEach((day) => {
    const dayKey = day.toDateString()
    appointmentsByDay[dayKey] = appointments.filter((apt) => {
      return apt.datetime.toDateString() === dayKey
    })
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {/* Day Headers */}
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={index}
              className={`p-4 text-center border-b border-gray-200 ${
                isToday ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-sm font-semibold text-gray-700">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Appointment Grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[500px]">
        {weekDays.map((day, index) => {
          const dayKey = day.toDateString()
          const dayAppointments = appointmentsByDay[dayKey] || []

          return (
            <div key={index} className="p-2 space-y-2">
              {dayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick(appointment)}
                  compact
                />
              ))}
              {dayAppointments.length === 0 && (
                <div className="text-center text-sm text-gray-400 mt-8">
                  No appointments
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
