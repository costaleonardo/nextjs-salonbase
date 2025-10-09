"use client";

import { useState, useEffect } from "react";
import {
  getServices,
  createService,
  updateService,
  archiveService,
  restoreService,
  deleteService,
  getStaffMembers,
  type ServiceInput,
  type ServiceUpdateInput,
} from "@/app/actions/services";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | { toNumber(): number }; // Support both number and Prisma Decimal
  staffIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchivedFilter, setShowArchivedFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceInput>({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    staffIds: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadServices(), loadStaffMembers()]);
  }

  async function loadServices(search?: string) {
    setLoading(true);
    const result = await getServices({
      search,
      isActive: showArchivedFilter ? undefined : true,
    });

    if (result.success && result.data) {
      setServices(result.data as Service[]);
    } else {
      console.error("Failed to load services:", result.error);
    }
    setLoading(false);
  }

  async function loadStaffMembers() {
    const result = await getStaffMembers();
    if (result.success && result.data) {
      setStaffMembers(result.data as StaffMember[]);
    }
  }

  function handleSearch(value: string) {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      loadServices(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  function openAddModal() {
    setFormData({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      staffIds: [],
    });
    setFormErrors({});
    setShowAddModal(true);
  }

  function openEditModal(service: Service) {
    setSelectedService(service);
    const priceValue = typeof service.price === 'number' ? service.price : service.price.toNumber();
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: priceValue,
      staffIds: service.staffIds,
    });
    setFormErrors({});
    setShowEditModal(true);
  }

  function openDeleteModal(service: Service) {
    setSelectedService(service);
    setShowDeleteModal(true);
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Service name is required";
    }

    if (formData.duration <= 0) {
      errors.duration = "Duration must be greater than 0";
    }

    if (formData.price < 0) {
      errors.price = "Price cannot be negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAddService() {
    if (!validateForm()) return;

    setSubmitting(true);
    const result = await createService(formData);

    if (result.success) {
      setShowAddModal(false);
      loadServices();
    } else {
      setFormErrors({ submit: result.error || "Failed to create service" });
    }
    setSubmitting(false);
  }

  async function handleUpdateService() {
    if (!validateForm() || !selectedService) return;

    setSubmitting(true);
    const updateData: ServiceUpdateInput = {
      name: formData.name,
      description: formData.description,
      duration: formData.duration,
      price: formData.price,
      staffIds: formData.staffIds,
    };

    const result = await updateService(selectedService.id, updateData);

    if (result.success) {
      setShowEditModal(false);
      setSelectedService(null);
      loadServices();
    } else {
      setFormErrors({ submit: result.error || "Failed to update service" });
    }
    setSubmitting(false);
  }

  async function handleArchiveService(service: Service) {
    const result = await archiveService(service.id);
    if (result.success) {
      loadServices();
    } else {
      alert(result.error || "Failed to archive service");
    }
  }

  async function handleRestoreService(service: Service) {
    const result = await restoreService(service.id);
    if (result.success) {
      loadServices();
    } else {
      alert(result.error || "Failed to restore service");
    }
  }

  async function handleDeleteService() {
    if (!selectedService) return;

    setSubmitting(true);
    const result = await deleteService(selectedService.id);

    if (result.success) {
      setShowDeleteModal(false);
      setSelectedService(null);
      loadServices();
    } else {
      alert(result.error || "Failed to delete service");
    }
    setSubmitting(false);
  }

  function formatCurrency(amount: number | { toNumber(): number }) {
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  function getStaffNames(staffIds: string[]) {
    if (staffIds.length === 0) return "All staff";
    const names = staffIds
      .map((id) => staffMembers.find((s) => s.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "All staff";
  }

  const filteredServices = services;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <p className="mt-2 text-gray-600">
          Manage your service catalog, pricing, and staff assignments
        </p>
      </div>

      {/* Search, Filter, and Add */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          {/* Search Bar */}
          <div className="relative max-w-md flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 py-2 pr-3 pl-10 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Show Archived Toggle */}
          <button
            onClick={() => {
              setShowArchivedFilter(!showArchivedFilter);
              setTimeout(() => loadServices(searchTerm), 0);
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 border ${
              showArchivedFilter
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700"
            } hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
          >
            <FunnelIcon className="h-5 w-5" />
            {showArchivedFilter ? "Show Active Only" : "Show All"}
          </button>
        </div>

        {/* Add Service Button */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first service.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Service
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`relative rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${
                !service.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Status Badge */}
              {!service.isActive && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    Archived
                  </span>
                </div>
              )}

              {/* Service Info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>{formatDuration(service.duration)}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{getStaffNames(service.staffIds)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>

                {service.isActive ? (
                  <button
                    onClick={() => handleArchiveService(service)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <ArchiveBoxIcon className="h-4 w-4" />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestoreService(service)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <ArchiveBoxXMarkIcon className="h-4 w-4" />
                    Restore
                  </button>
                )}

                <button
                  onClick={() => openDeleteModal(service)}
                  className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddModal(false)}
            ></div>

            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Service
              </h3>

              <div className="space-y-4">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`block w-full rounded-lg border ${
                      formErrors.name ? "border-red-300" : "border-gray-300"
                    } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                    placeholder="e.g., Haircut"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Brief description of the service"
                  />
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      min="1"
                      step="5"
                      className={`block w-full rounded-lg border ${
                        formErrors.duration ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                    />
                    {formErrors.duration && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.duration}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className={`block w-full rounded-lg border ${
                        formErrors.price ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                    )}
                  </div>
                </div>

                {/* Staff Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Staff
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty to assign to all staff
                  </p>
                  <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {staffMembers.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.staffIds?.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                staffIds: [...(formData.staffIds || []), staff.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                staffIds: (formData.staffIds || []).filter(
                                  (id) => id !== staff.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {staff.name}
                          </p>
                          <p className="text-xs text-gray-500">{staff.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formErrors.submit && (
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditModal(false)}
            ></div>

            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Service
              </h3>

              <div className="space-y-4">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={`block w-full rounded-lg border ${
                      formErrors.name ? "border-red-300" : "border-gray-300"
                    } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      min="1"
                      step="5"
                      className={`block w-full rounded-lg border ${
                        formErrors.duration ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                    />
                    {formErrors.duration && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.duration}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      className={`block w-full rounded-lg border ${
                        formErrors.price ? "border-red-300" : "border-gray-300"
                      } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                    />
                    {formErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                    )}
                  </div>
                </div>

                {/* Staff Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Staff
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty to assign to all staff
                  </p>
                  <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                    {staffMembers.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.staffIds?.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                staffIds: [...(formData.staffIds || []), staff.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                staffIds: (formData.staffIds || []).filter(
                                  (id) => id !== staff.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {staff.name}
                          </p>
                          <p className="text-xs text-gray-500">{staff.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formErrors.submit && (
                  <p className="text-sm text-red-600">{formErrors.submit}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateService}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            ></div>

            <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Service
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to permanently delete "{selectedService.name}"?
                This action cannot be undone. Consider archiving instead if you want
                to keep historical data.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
