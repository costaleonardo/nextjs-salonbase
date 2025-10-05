'use client'

import { useState } from 'react'
import { createPublicBooking } from '@/app/actions/public-bookings'

type BookingData = {
  serviceId?: string
  staffId?: string
  datetime?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  notes?: string
}

type ClientFormProps = {
  salonId: string
  bookingData: BookingData
  onSubmit: (appointmentId: string) => void
  onBack: () => void
}

export function ClientForm({ salonId, bookingData, onSubmit, onBack }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: bookingData.clientName || '',
    email: bookingData.clientEmail || '',
    phone: bookingData.clientPhone || '',
    notes: bookingData.notes || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.contact = 'Please provide either email or phone number'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone.trim() && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    if (!bookingData.serviceId || !bookingData.staffId || !bookingData.datetime) {
      setSubmitError('Missing booking information. Please start over.')
      return
    }

    setIsSubmitting(true)

    const result = await createPublicBooking({
      salonId,
      serviceId: bookingData.serviceId,
      staffId: bookingData.staffId,
      datetime: bookingData.datetime,
      clientName: formData.name,
      clientEmail: formData.email || undefined,
      clientPhone: formData.phone || undefined,
      notes: formData.notes || undefined,
    })

    if (result.success) {
      onSubmit(result.data.appointmentId)
    } else {
      setSubmitError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Information</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          style={{ minHeight: '44px', minWidth: '44px' }}
          disabled={isSubmitting}
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="John Doe"
            autoComplete="name"
            disabled={isSubmitting}
            style={{ minHeight: '44px' }}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email {!formData.phone && <span className="text-red-500">*</span>}
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="john@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            style={{ minHeight: '44px' }}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number {!formData.email && <span className="text-red-500">*</span>}
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            disabled={isSubmitting}
            style={{ minHeight: '44px' }}
          />
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>

        {errors.contact && !errors.email && !errors.phone && (
          <p className="text-sm text-red-600">{errors.contact}</p>
        )}

        {/* Notes (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Any special requests or notes..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
          style={{ minHeight: '44px' }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Booking...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </form>
    </div>
  )
}
