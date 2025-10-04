import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/dashboard/Sidebar"
import MobileNav from "@/components/dashboard/MobileNav"
import UserMenu from "@/components/dashboard/UserMenu"
import Breadcrumb from "@/components/dashboard/Breadcrumb"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Only OWNER and STAFF can access dashboard
  if (session.user.role !== "OWNER" && session.user.role !== "STAFF") {
    redirect("/portal")
  }

  const userRole = session.user.role as "OWNER" | "STAFF"

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar userRole={userRole} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 lg:border-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileNav userRole={userRole} />
            </div>

            {/* Logo for mobile */}
            <div className="flex items-center lg:hidden">
              <h1 className="text-lg font-bold text-gray-900">SalonBase</h1>
            </div>

            {/* Desktop: Empty div for spacing */}
            <div className="hidden lg:block flex-1" />

            {/* User Menu */}
            <div className="flex items-center">
              <UserMenu
                userName={session.user.name || "User"}
                userRole={userRole}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
