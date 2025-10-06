import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AuditLogTable from "./AuditLogTable";

export default async function PaymentAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.salonId) {
    redirect("/login");
  }

  // Only OWNER can view audit logs
  if (session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  // Fetch recent audit logs (last 100 entries)
  const auditLogs = await db.paymentAuditLog.findMany({
    where: params.paymentId
      ? {
          paymentId: params.paymentId,
          payment: {
            appointment: {
              salonId: session.user.salonId,
            },
          },
        }
      : {
          payment: {
            appointment: {
              salonId: session.user.salonId,
            },
          },
        },
    include: {
      payment: {
        include: {
          appointment: {
            include: {
              client: true,
              service: true,
              staff: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Fetch all payments for filter dropdown
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
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all payment decisions and actions
          </p>
        </div>
      </div>

      <AuditLogTable
        auditLogs={JSON.parse(
          JSON.stringify(auditLogs, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        )}
        payments={JSON.parse(
          JSON.stringify(payments, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        )}
        currentPaymentId={params.paymentId}
      />
    </div>
  );
}
