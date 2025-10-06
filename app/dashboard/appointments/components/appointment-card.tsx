"use client";

import { Appointment } from "../appointments-view";

type AppointmentCardProps = {
  appointment: Appointment;
  onClick: () => void;
  compact?: boolean;
};

export function AppointmentCard({ appointment, onClick, compact = false }: AppointmentCardProps) {
  const statusColors = {
    SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    NO_SHOW: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const statusColor =
    statusColors[appointment.status as keyof typeof statusColors] || statusColors.SCHEDULED;

  const startTime = appointment.datetime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endTime = new Date(
    appointment.datetime.getTime() + appointment.service.duration * 60000
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full rounded border p-2 text-left ${statusColor} transition-shadow hover:shadow-md`}
      >
        <div className="text-xs font-semibold">{startTime}</div>
        <div className="truncate text-sm font-medium">{appointment.client.name}</div>
        <div className="truncate text-xs text-gray-600">{appointment.service.name}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left ${statusColor} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {startTime} - {endTime}
            </span>
            <span className="rounded-full border border-current bg-white px-2 py-0.5 text-xs">
              {appointment.status}
            </span>
          </div>

          <div className="mb-1 text-base font-semibold text-gray-900">
            {appointment.client.name}
          </div>

          <div className="mb-1 text-sm text-gray-700">
            <span className="font-medium">{appointment.service.name}</span>
            <span className="text-gray-500"> • {appointment.service.duration} min</span>
            <span className="text-gray-500"> • ${appointment.service.price.toString()}</span>
          </div>

          <div className="text-sm text-gray-600">with {appointment.staff.name}</div>

          {appointment.client.phone && (
            <div className="mt-1 text-sm text-gray-500">{appointment.client.phone}</div>
          )}

          {appointment.notes && (
            <div className="mt-2 text-sm text-gray-600 italic">Note: {appointment.notes}</div>
          )}
        </div>
      </div>
    </button>
  );
}
