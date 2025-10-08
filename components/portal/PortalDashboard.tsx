"use client"

import { useState } from "react"
import type { Client, Appointment, Service, Payment, Membership, MembershipTier, GiftCertificate } from "@prisma/client"
import { AppointmentCard } from "./AppointmentCard"
import { MembershipCard } from "./MembershipCard"
import { GiftCertificateCard } from "./GiftCertificateCard"
import { CancelAppointmentModal } from "./CancelAppointmentModal"
import { RescheduleAppointmentModal } from "./RescheduleAppointmentModal"

type AppointmentWithRelations = Appointment & {
  service: Service
  staff: {
    name: string | null
    email: string | null
  }
  payment: Payment | null
}

type MembershipWithTier = Membership & {
  tier: MembershipTier
}

interface PortalDashboardProps {
  client: Client
  upcomingAppointments: AppointmentWithRelations[]
  pastAppointments: AppointmentWithRelations[]
  membership: MembershipWithTier | null
  giftCertificates: GiftCertificate[]
}

export function PortalDashboard({
  client,
  upcomingAppointments,
  pastAppointments,
  membership,
  giftCertificates,
}: PortalDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming")
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)

  const totalGiftCertificateBalance = giftCertificates.reduce(
    (sum, cert) => sum + Number(cert.balance),
    0
  )

  const handleCancelClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment)
    setCancelModalOpen(true)
  }

  const handleRescheduleClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment)
    setRescheduleModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {client.name || "Client"}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">{client.email}</p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0">
              <a
                href="/api/auth/signout"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Appointments */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setSelectedTab("upcoming")}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                      selectedTab === "upcoming"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    Upcoming Appointments
                    {upcomingAppointments.length > 0 && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {upcomingAppointments.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedTab("past")}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                      selectedTab === "past"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    Past Appointments
                  </button>
                </nav>
              </div>
            </div>

            {/* Appointment List */}
            <div className="space-y-4">
              {selectedTab === "upcoming" ? (
                upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onCancel={handleCancelClick}
                      onReschedule={handleRescheduleClick}
                    />
                  ))
                ) : (
                  <div className="rounded-lg bg-white p-12 text-center shadow">
                    <p className="text-gray-500">No upcoming appointments</p>
                    <p className="mt-2 text-sm text-gray-400">
                      Book a new appointment to get started
                    </p>
                  </div>
                )
              ) : pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isPast={true}
                  />
                ))
              ) : (
                <div className="rounded-lg bg-white p-12 text-center shadow">
                  <p className="text-gray-500">No past appointments</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Membership & Gift Certificates */}
          <div className="space-y-6">
            {/* Membership Card */}
            {membership && <MembershipCard membership={membership} />}

            {/* Gift Certificates */}
            {giftCertificates.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Gift Certificates
                </h2>
                <div className="mb-4 rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalGiftCertificateBalance.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-3">
                  {giftCertificates.map((cert) => (
                    <GiftCertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Your Information
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-gray-900">
                    {client.name}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-gray-900">{client.email}</dd>
                </div>
                {client.phone && (
                  <div>
                    <dt className="font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-gray-900">{client.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedAppointment && (
        <>
          <CancelAppointmentModal
            appointment={selectedAppointment}
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false)
              setSelectedAppointment(null)
            }}
          />
          <RescheduleAppointmentModal
            appointment={selectedAppointment}
            isOpen={rescheduleModalOpen}
            onClose={() => {
              setRescheduleModalOpen(false)
              setSelectedAppointment(null)
            }}
          />
        </>
      )}
    </div>
  )
}
