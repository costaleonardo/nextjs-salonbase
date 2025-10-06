import { getSalonBySlug } from "@/app/actions/public-bookings";
import { BookingWidget } from "./components/booking-widget";
import { redirect } from "next/navigation";

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ salonSlug: string }>;
}) {
  const { salonSlug } = await params;
  const result = await getSalonBySlug(salonSlug);

  if (!result.success) {
    redirect("/404");
  }

  const salon = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{salon.name}</h1>
          {salon.address && <p className="mt-1 text-sm text-gray-600">{salon.address}</p>}
        </div>
      </div>

      {/* Booking Widget */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <BookingWidget salon={salon} />
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-2xl px-4 py-8 text-center text-sm text-gray-500">
        <p>Powered by SalonBase</p>
      </div>
    </div>
  );
}
