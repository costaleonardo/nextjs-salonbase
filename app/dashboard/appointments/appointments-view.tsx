'use client'

import { useState, useEffect } from 'react'
import { getAppointments } from '@/app/actions/appointments'
import { AppointmentCalendar } from './components/appointment-calendar'
import { CreateAppointmentModal } from './components/create-appointment-modal'
import { EditAppointmentModal } from './components/edit-appointment-modal'

export type CalendarView = 'day' | 'week'

export type Appointment = {
  id: string
  datetime: Date
  status: string
  notes: string | null
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  staff: {
    id: string
    name: string
    email: string
  }
  service: {
    id: string
    name: string
    duration: number
    price: number
  }
}

export function AppointmentsView() {
  const [view, setView] = useState<CalendarView>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  // Fetch appointments based on current date and view
  useEffect(() => {
    fetchAppointments()
  }, [currentDate, view])

  async function fetchAppointments() {
    setLoading(true)
    try {
      let startDate: Date
      let endDate: Date

      if (view === 'day') {
        // Fetch appointments for the current day
        startDate = new Date(currentDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(currentDate)
        endDate.setHours(23, 59, 59, 999)
      } else {
        // Fetch appointments for the week (Sunday to Saturday)
        const dayOfWeek = currentDate.getDay()
        startDate = new Date(currentDate)
        startDate.setDate(currentDate.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
      }

      const result = await getAppointments({
        startDate,
        endDate,
      })

      if (result.success) {
        // Convert datetime strings to Date objects
        const appointmentsWithDates = result.data.map((apt: any) => ({
          ...apt,
          datetime: new Date(apt.datetime),
        }))
        setAppointments(appointmentsWithDates)
      } else {
        console.error('Failed to fetch appointments:', result.error)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  function handlePrevious() {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setCurrentDate(newDate)
  }

  function handleNext() {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setCurrentDate(newDate)
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  function handleAppointmentClick(appointment: Appointment) {
    setEditingAppointment(appointment)
  }

  function handleAppointmentCreated() {
    setIsCreateModalOpen(false)
    fetchAppointments()
  }

  function handleAppointmentUpdated() {
    setEditingAppointment(null)
    fetchAppointments()
  }

  function handleAppointmentDeleted() {
    setEditingAppointment(null)
    fetchAppointments()
  }

  return (
    <div>
      {/* Header Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
          <div className="ml-4 text-lg font-semibold">
            {view === 'day'
              ? currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : `Week of ${currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
          </div>
        </div>

        {/* View Toggle & Create Button */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium border ${
                view === 'day'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-md`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${
                view === 'week'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-md`}
            >
              Week
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading appointments...</div>
        </div>
      ) : (
        <AppointmentCalendar
          view={view}
          currentDate={currentDate}
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Modals */}
      <CreateAppointmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAppointmentCreated}
        defaultDate={currentDate}
      />

      {editingAppointment && (
        <EditAppointmentModal
          isOpen={true}
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSuccess={handleAppointmentUpdated}
          onDelete={handleAppointmentDeleted}
        />
      )}
    </div>
  )
}
