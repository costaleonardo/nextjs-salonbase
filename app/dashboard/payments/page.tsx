import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user?.salonId) {
    redirect("/login");
  }

  // Fetch recent payments
  const payments = await db.payment.findMany({
    where: {
      appointment: {
        salonId: session.user.salonId,
      },
    },
    include: {
      appointment: {
        include: {
          client: true,
          service: true,
          staff: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  // Calculate stats
  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayments = payments.filter((p) => p.status === "PENDING").length;
  const failedPayments = payments.filter((p) => p.status === "FAILED").length;
  const refundedPayments = payments.filter((p) => p.status === "REFUNDED").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "CREDIT_CARD":
        return "bg-blue-100 text-blue-800";
      case "GIFT_CERTIFICATE":
        return "bg-purple-100 text-purple-800";
      case "CASH":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">View and manage payment transactions</p>
        </div>
        {session.user.role === "OWNER" && (
          <Link
            href="/dashboard/payments/audit"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <DocumentTextIcon className="h-5 w-5" />
            View Audit Log
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-muted-foreground text-sm font-medium">Total Revenue</div>
          <div className="mt-2 text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-muted-foreground text-sm font-medium">Pending</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">{pendingPayments}</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-muted-foreground text-sm font-medium">Failed</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{failedPayments}</div>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <div className="text-muted-foreground text-sm font-medium">Refunded</div>
          <div className="mt-2 text-3xl font-bold text-gray-600">{refundedPayments}</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Service</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Staff</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Method</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-12 text-center text-sm">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                      <div className="text-muted-foreground text-xs">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {payment.appointment.client.name}
                    </td>
                    <td className="px-6 py-4 text-sm">{payment.appointment.service.name}</td>
                    <td className="px-6 py-4 text-sm">{payment.appointment.staff.name}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      ${Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMethodColor(payment.method)}`}
                      >
                        {payment.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
