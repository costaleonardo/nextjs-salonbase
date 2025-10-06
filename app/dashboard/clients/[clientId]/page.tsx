"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClientById, updateClient, deleteClient } from "@/app/actions/clients";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  BellSlashIcon,
} from "@heroicons/react/24/outline";
import type { Appointment, Service, User, Payment, GiftCertificate } from "@prisma/client";

type ClientData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  appointments: (Appointment & {
    service: Service;
    staff: Pick<User, "id" | "name" | "email">;
    payment: Payment | null;
  })[];
  giftCertificates: GiftCertificate[];
  memberships: any[]; // Allow any to handle Decimal type from Prisma
  stats: {
    totalSpend: number;
    visitCount: number;
    lastVisit: Date | null;
    upcomingAppointments: number;
  };
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  async function loadClient() {
    setLoading(true);
    const result = await getClientById(clientId);

    if (result.success && result.data) {
      setClient(result.data as ClientData);
    } else {
      console.error("Failed to load client:", result.error);
    }
    setLoading(false);
  }

  async function handleDelete() {
    const result = await deleteClient(clientId);
    if (result.success) {
      router.push("/dashboard/clients");
    } else {
      alert(result.error || "Failed to delete client");
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatDate(date: Date | null) {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function getStatusBadge(status: string) {
    const styles = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      NO_SHOW: "bg-gray-100 text-gray-800",
    };
    return styles[status as keyof typeof styles] || styles.SCHEDULED;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">Client not found</h3>
          <button
            onClick={() => router.push("/dashboard/clients")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/clients")}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to clients
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <div className="mt-2 space-y-1 text-gray-600">
              {client.email && (
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                    {client.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Total Spend</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(client.stats.totalSpend)}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Total Visits</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{client.stats.visitCount}</div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <ClockIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Last Visit</span>
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {formatDate(client.stats.lastVisit)}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Upcoming</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {client.stats.upcomingAppointments}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Appointment History */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Appointment History</h2>

            {client.appointments.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No appointments yet</p>
            ) : (
              <div className="space-y-4">
                {client.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-r-lg border-l-4 border-blue-500 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {appointment.service.name}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(appointment.status)}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDateTime(appointment.datetime)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>with {appointment.staff.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            {appointment.service.duration} minutes
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="italic">{appointment.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {appointment.payment && (
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(Number(appointment.payment.amount))}
                          </div>
                        )}
                        {appointment.payment?.status === "COMPLETED" && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                            <CheckCircleIcon className="h-4 w-4" />
                            Paid
                          </div>
                        )}
                        {appointment.payment?.status === "REFUNDED" && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                            <XCircleIcon className="h-4 w-4" />
                            Refunded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Notes */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Client Notes</h2>
            {client.notes ? (
              <p className="whitespace-pre-wrap text-gray-700">{client.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes yet</p>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Notifications</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {client.emailNotificationsEnabled ? (
                  <BellIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <BellSlashIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">
                  Email: {client.emailNotificationsEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {client.smsNotificationsEnabled ? (
                  <BellIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <BellSlashIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">
                  SMS: {client.smsNotificationsEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Gift Certificates */}
          {client.giftCertificates.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Gift Certificates</h2>
              <div className="space-y-2">
                {client.giftCertificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-600">{cert.code}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(Number(cert.balance))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memberships */}
          {client.memberships.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Memberships</h2>
              <div className="space-y-3">
                {client.memberships.map((membership) => (
                  <div key={membership.id}>
                    <div className="font-semibold text-gray-900">{membership.tier.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(Number(membership.tier.price))}/month
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {membership.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Client Info</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Created:</span> {formatDate(client.createdAt)}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {formatDate(client.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditClientModal
          client={client}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadClient();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Delete Client</h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Edit Client Modal Component
// ============================================

function EditClientModal({
  client,
  onClose,
  onSuccess,
}: {
  client: ClientData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || "",
    phone: client.phone || "",
    notes: client.notes || "",
    emailNotificationsEnabled: client.emailNotificationsEnabled,
    smsNotificationsEnabled: client.smsNotificationsEnabled,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateClient(client.id, {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      notes: formData.notes || undefined,
      emailNotificationsEnabled: formData.emailNotificationsEnabled,
      smsNotificationsEnabled: formData.smsNotificationsEnabled,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Failed to update client");
    }

    setLoading(false);
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Edit Client</h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Notification Preferences */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.emailNotificationsEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailNotificationsEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable email notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.smsNotificationsEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smsNotificationsEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable SMS notifications</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
