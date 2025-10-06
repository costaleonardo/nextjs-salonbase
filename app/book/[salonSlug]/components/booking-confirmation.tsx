"use client";

import { Service, User } from "@prisma/client";

type BookingData = {
  serviceId?: string;
  staffId?: string;
  datetime?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
};

type SalonInfo = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type BookingConfirmationProps = {
  salon: SalonInfo;
  bookingData: BookingData;
  appointmentId: string;
  selectedService?: Service;
  selectedStaff?: Pick<User, "id" | "name" | "email">;
};

export function BookingConfirmation({
  salon,
  bookingData,
  selectedService,
  selectedStaff,
}: BookingConfirmationProps) {
  const formatDateTime = (datetime?: string) => {
    if (!datetime) return "";
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const addToCalendar = () => {
    if (!bookingData.datetime || !selectedService) return;

    const startDate = new Date(bookingData.datetime);
    const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);

    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const title = `${selectedService.name} at ${salon.name}`;
    const details = `Appointment with ${selectedStaff?.name || "staff member"} at ${salon.name}`;
    const location = salon.address || salon.name;

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(
      endDate
    )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

    window.open(googleCalendarUrl, "_blank");
  };

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20">
        <svg
          className="h-8 w-8 text-green-600 sm:h-10 sm:w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
      <p className="mb-8 text-gray-600">
        You&apos;re all set! We&apos;ve sent a confirmation to{" "}
        {bookingData.clientEmail || bookingData.clientPhone}.
      </p>

      {/* Appointment Details */}
      <div className="mb-6 rounded-lg bg-gray-50 p-6 text-left">
        <h3 className="mb-4 font-semibold text-gray-900">Appointment Details</h3>
        <div className="space-y-3">
          {/* Service */}
          {selectedService && (
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium text-gray-900">{selectedService.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedService.duration} min · ${selectedService.price.toString()}
                </p>
              </div>
            </div>
          )}

          {/* Staff */}
          {selectedStaff && (
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Staff Member</p>
                <p className="font-medium text-gray-900">{selectedStaff.name}</p>
              </div>
            </div>
          )}

          {/* Date & Time */}
          {bookingData.datetime && (
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium text-gray-900">{formatDateTime(bookingData.datetime)}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {salon.address && (
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900">{salon.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={addToCalendar}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98]"
          style={{ minHeight: "44px" }}
        >
          Add to Calendar
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98]"
          style={{ minHeight: "44px" }}
        >
          Book Another Appointment
        </button>
      </div>

      {/* Contact Info */}
      {(salon.phone || salon.email) && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="mb-2 text-sm text-gray-600">Need to make changes?</p>
          <div className="flex flex-col items-center gap-2 text-sm">
            {salon.phone && (
              <a
                href={`tel:${salon.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Call {salon.phone}
              </a>
            )}
            {salon.email && (
              <a
                href={`mailto:${salon.email}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Email {salon.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
