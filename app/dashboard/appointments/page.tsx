import { Suspense } from "react";
import { AppointmentsView } from "./appointments-view";

export default function AppointmentsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="mt-1 text-gray-600">Manage your salon appointments</p>
      </div>

      <Suspense fallback={<div>Loading appointments...</div>}>
        <AppointmentsView />
      </Suspense>
    </div>
  );
}
