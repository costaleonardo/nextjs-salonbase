"use client";

import { useState, useEffect } from "react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getBlockedTimes,
  createBlockedTime,
  deleteBlockedTime,
  type StaffInput,
  type StaffUpdateInput,
  type BlockedTimeInput,
} from "@/app/actions/staff";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  createdAt: Date;
  updatedAt: Date;
  _count: {
    staffAppointments: number;
    blockedTimes: number;
  };
};

type BlockedTime = {
  id: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
  recurring: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffInput>({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });
  const [blockedTimeData, setBlockedTimeData] = useState<{
    startTime: string;
    endTime: string;
    reason: string;
    recurring: boolean;
  }>({
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff(search?: string) {
    setLoading(true);
    const result = await getStaff({ search });

    if (result.success && result.data) {
      setStaff(result.data as Staff[]);
    } else {
      console.error("Failed to load staff:", result.error);
    }
    setLoading(false);
  }

  async function loadBlockedTimes(staffId: string) {
    const result = await getBlockedTimes(staffId);
    if (result.success && result.data) {
      setBlockedTimes(result.data as BlockedTime[]);
    }
  }

  function handleSearch(value: string) {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      loadStaff(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  function openAddModal() {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STAFF",
    });
    setFormErrors({});
    setShowAddModal(true);
  }

  function openEditModal(staffMember: Staff) {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: "",
      role: staffMember.role,
    });
    setFormErrors({});
    setShowEditModal(true);
  }

  function openDeleteModal(staffMember: Staff) {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
  }

  function openScheduleModal(staffMember: Staff) {
    setSelectedStaff(staffMember);
    loadBlockedTimes(staffMember.id);
    setBlockedTimeData({
      startTime: "",
      endTime: "",
      reason: "",
      recurring: false,
    });
    setShowScheduleModal(true);
  }

  async function handleSubmitAdd() {
    setFormErrors({});
    setSubmitting(true);

    const result = await createStaff(formData);

    if (result.success) {
      setShowAddModal(false);
      loadStaff();
    } else {
      setFormErrors({ general: result.error || "Failed to add staff member" });
    }
    setSubmitting(false);
  }

  async function handleSubmitEdit() {
    if (!selectedStaff) return;

    setFormErrors({});
    setSubmitting(true);

    const updateData: StaffUpdateInput = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    // Only include password if it's provided
    if (formData.password && formData.password.trim()) {
      updateData.password = formData.password;
    }

    const result = await updateStaff(selectedStaff.id, updateData);

    if (result.success) {
      setShowEditModal(false);
      loadStaff();
    } else {
      setFormErrors({ general: result.error || "Failed to update staff member" });
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!selectedStaff) return;

    setSubmitting(true);
    const result = await deleteStaff(selectedStaff.id);

    if (result.success) {
      setShowDeleteModal(false);
      loadStaff();
    } else {
      setFormErrors({ general: result.error || "Failed to delete staff member" });
    }
    setSubmitting(false);
  }

  async function handleAddBlockedTime() {
    if (!selectedStaff) return;

    setFormErrors({});
    setSubmitting(true);

    const input: BlockedTimeInput = {
      staffId: selectedStaff.id,
      startTime: new Date(blockedTimeData.startTime),
      endTime: new Date(blockedTimeData.endTime),
      reason: blockedTimeData.reason || undefined,
      recurring: blockedTimeData.recurring,
    };

    const result = await createBlockedTime(input);

    if (result.success) {
      loadBlockedTimes(selectedStaff.id);
      setBlockedTimeData({
        startTime: "",
        endTime: "",
        reason: "",
        recurring: false,
      });
    } else {
      setFormErrors({ blockedTime: result.error || "Failed to add blocked time" });
    }
    setSubmitting(false);
  }

  async function handleDeleteBlockedTime(id: string) {
    if (!selectedStaff) return;

    const result = await deleteBlockedTime(id);
    if (result.success) {
      loadBlockedTimes(selectedStaff.id);
    }
  }

  const filteredStaff = staff;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your salon staff members and schedules</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Staff Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
        />
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No staff members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new staff member.</p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff Member
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{staffMember.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{staffMember.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        staffMember.role === "OWNER"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {staffMember.role === "OWNER" ? (
                        <ShieldCheckIcon className="h-3 w-3" />
                      ) : (
                        <UserIcon className="h-3 w-3" />
                      )}
                      {staffMember.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div>
                  <p className="text-xs text-gray-500">Appointments</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {staffMember._count.staffAppointments}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blocked Times</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {staffMember._count.blockedTimes}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openScheduleModal(staffMember)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <CalendarIcon className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => openEditModal(staffMember)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <PencilIcon className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(staffMember)}
                  className="flex-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
                >
                  <TrashIcon className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)} />
            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Staff Member</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {formErrors.general && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{formErrors.general}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "OWNER" | "STAFF" })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAdd}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Staff"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Staff Member</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {formErrors.general && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{formErrors.general}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "OWNER" | "STAFF" })}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)} />
            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Staff Member</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete <strong>{selectedStaff.name}</strong>? This action cannot be undone.
                </p>
              </div>

              {formErrors.general && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{formErrors.general}</div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowScheduleModal(false)} />
            <div className="relative w-full max-w-2xl transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Schedule for {selectedStaff.name}
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Add Blocked Time Form */}
              <div className="mb-6 rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Blocked Time</h4>
                {formErrors.blockedTime && (
                  <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{formErrors.blockedTime}</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      value={blockedTimeData.startTime}
                      onChange={(e) => setBlockedTimeData({ ...blockedTimeData, startTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      value={blockedTimeData.endTime}
                      onChange={(e) => setBlockedTimeData({ ...blockedTimeData, endTime: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <input
                      type="text"
                      value={blockedTimeData.reason}
                      onChange={(e) => setBlockedTimeData({ ...blockedTimeData, reason: e.target.value })}
                      placeholder="e.g., Lunch break, Vacation"
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={blockedTimeData.recurring}
                      onChange={(e) => setBlockedTimeData({ ...blockedTimeData, recurring: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Recurring</label>
                  </div>
                </div>
                <button
                  onClick={handleAddBlockedTime}
                  disabled={submitting}
                  className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Blocked Time"}
                </button>
              </div>

              {/* Blocked Times List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Blocked Times</h4>
                {blockedTimes.length === 0 ? (
                  <p className="text-sm text-gray-500">No blocked times scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {blockedTimes.map((bt) => (
                      <div key={bt.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(bt.startTime).toLocaleString()} - {new Date(bt.endTime).toLocaleString()}
                          </p>
                          {bt.reason && <p className="text-xs text-gray-500">{bt.reason}</p>}
                          {bt.recurring && (
                            <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              Recurring
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBlockedTime(bt.id)}
                          className="ml-3 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
