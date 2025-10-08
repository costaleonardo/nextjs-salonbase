import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PortalDashboard } from "@/components/portal/PortalDashboard"

export default async function PortalPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/portal")
  }

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard")
  }

  // Fetch client data
  const client = await db.client.findFirst({
    where: {
      email: session.user.email!,
    },
  })

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Client Profile Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            Please contact the salon to set up your account.
          </p>
        </div>
      </div>
    )
  }

  // Fetch upcoming appointments
  const upcomingAppointments = await db.appointment.findMany({
    where: {
      clientId: client.id,
      datetime: {
        gte: new Date(),
      },
      status: {
        in: ["SCHEDULED"],
      },
    },
    include: {
      service: true,
      staff: {
        select: {
          name: true,
          email: true,
        },
      },
      payment: true,
    },
    orderBy: {
      datetime: "asc",
    },
  })

  // Fetch past appointments
  const pastAppointments = await db.appointment.findMany({
    where: {
      clientId: client.id,
      OR: [
        {
          datetime: {
            lt: new Date(),
          },
        },
        {
          status: {
            in: ["COMPLETED", "CANCELLED", "NO_SHOW"],
          },
        },
      ],
    },
    include: {
      service: true,
      staff: {
        select: {
          name: true,
          email: true,
        },
      },
      payment: true,
    },
    orderBy: {
      datetime: "desc",
    },
    take: 10, // Show last 10 appointments
  })

  // Fetch membership status
  const membership = await db.membership.findFirst({
    where: {
      clientId: client.id,
      status: "ACTIVE",
    },
    include: {
      tier: true,
    },
  })

  // Fetch gift certificates
  const giftCertificates = await db.giftCertificate.findMany({
    where: {
      clientId: client.id,
      balance: {
        gt: 0,
      },
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gte: new Date(),
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <PortalDashboard
      client={client}
      upcomingAppointments={upcomingAppointments}
      pastAppointments={pastAppointments}
      membership={membership}
      giftCertificates={giftCertificates}
    />
  )
}
