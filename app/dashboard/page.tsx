import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome back, {session?.user?.name}!
      </h2>
      <p className="mt-2 text-gray-600">
        Your dashboard overview will appear here.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">
            Today's Appointments
          </h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Clients</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900">Revenue Today</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">$0</p>
        </div>
      </div>
    </div>
  )
}
