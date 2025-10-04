import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PortalPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Client Portal
        </h1>
        <p className="text-gray-600 mb-4">
          Welcome, {session.user.name}!
        </p>
        <p className="text-sm text-gray-500">
          The client portal is under construction. This feature will be available in Phase 3.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To access the staff dashboard, you need to sign up as a salon owner or staff member.
          </p>
        </div>
      </div>
    </div>
  )
}
