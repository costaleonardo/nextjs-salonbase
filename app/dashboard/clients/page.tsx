"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClients, createClient, type ClientWithStats } from "@/app/actions/clients";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients(search?: string) {
    setLoading(true);
    const result = await getClients({
      search,
      salonId: "", // Will use session salonId
    });

    if (result.success && result.data) {
      setClients(result.data);
    } else {
      console.error("Failed to load clients:", result.error);
    }
    setLoading(false);
  }

  function handleSearch(value: string) {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      loadClients(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  function formatDate(date: Date | null) {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="mt-2 text-gray-600">
          Manage your client database and view appointment history
        </p>
      </div>

      {/* Search and Add */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Add Client Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5" />
          Add Client
        </button>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? "Try adjusting your search" : "Get started by adding your first client"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              {/* Client Name */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
              </div>

              {/* Contact Info */}
              <div className="mb-4 space-y-2 text-sm text-gray-600">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CurrencyDollarIcon className="h-4 w-4" />
                    Total Spend
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(client.totalSpend)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    Visits
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {client.visitCount}
                  </div>
                </div>
              </div>

              {/* Last Visit */}
              <div className="mt-4 text-xs text-gray-500">
                Last visit: {formatDate(client.lastVisit)}
              </div>

              {/* Upcoming Badge */}
              {client.upcomingAppointments > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {client.upcomingAppointments} upcoming
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadClients(searchTerm);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// Add Client Modal Component
// ============================================

function AddClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createClient({
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
      setError(result.error || "Failed to create client");
    }

    setLoading(false);
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Add New Client</h2>

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
              placeholder="John Doe"
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
              placeholder="john@example.com"
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
              placeholder="(555) 123-4567"
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
              placeholder="Any special notes about this client..."
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
              {loading ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
