import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Client Portal</h1>
        <p className="mb-4 text-gray-600">Welcome, {session.user.name}!</p>
        <p className="text-sm text-gray-500">
          The client portal is under construction. This feature will be available in Phase 3.
        </p>
        <div className="mt-6 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To access the staff dashboard, you need to sign up as a salon
            owner or staff member.
          </p>
        </div>
      </div>
    </div>
  );
}
