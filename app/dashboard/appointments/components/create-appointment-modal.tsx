'use client'

import { useState, useEffect } from 'react'
import { createAppointment, checkAppointmentConflicts } from '@/app/actions/appointments'

type CreateAppointmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDate?: Date
}

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

type Staff = {
  id: string
  name: string
}

type Service = {
  id: string
  name: string
  duration: number
  price: number
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate = new Date(),
}: CreateAppointmentModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    serviceId: '',
    date: defaultDate.toISOString().split('T')[0],
    time: '09:00',
    notes: '',
  })

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchStaff()
      fetchServices()
    }
  }, [isOpen])

  // Check for conflicts when datetime or staff changes
  useEffect(() => {
    if (formData.staffId && formData.serviceId && formData.date && formData.time) {
      checkConflicts()
    }
  }, [formData.staffId, formData.serviceId, formData.date, formData.time])

  async function fetchClients() {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  async function fetchStaff() {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  async function fetchServices() {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  async function checkConflicts() {
    try {
      const datetime = new Date(`${formData.date}T${formData.time}`)
      const result = await checkAppointmentConflicts(
        formData.staffId,
        formData.serviceId,
        datetime
      )

      if (result.success && result.data.hasConflict) {
        setConflictWarning(result.data.conflict?.details || 'Time slot unavailable')
      } else {
        setConflictWarning(null)
      }
    } catch (error) {
      console.error('Error checking conflicts:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const datetime = new Date(`${formData.date}T${formData.time}`)

      const result = await createAppointment({
        clientId: formData.clientId,
        staffId: formData.staffId,
        serviceId: formData.serviceId,
        datetime,
        notes: formData.notes || undefined,
      })

      if (result.success) {
        onSuccess()
        resetForm()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to create appointment')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      clientId: '',
      staffId: '',
      serviceId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      notes: '',
    })
    setError(null)
    setConflictWarning(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">New Appointment</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.email ? `(${client.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                required
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min - ${service.price.toString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Member *
              </label>
              <select
                required
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select staff member</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Conflict Warning */}
            {conflictWarning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-800">{conflictWarning}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any special notes or requests..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!conflictWarning}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
