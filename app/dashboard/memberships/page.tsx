import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function MembershipsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "STAFF") {
    redirect("/portal");
  }

  const salonId = session.user.salonId;
  if (!salonId) {
    return (
      <div className="p-6">
        <p className="text-red-600">You must be associated with a salon to view memberships.</p>
      </div>
    );
  }

  // Fetch membership tiers
  const tiers = await db.membershipTier.findMany({
    where: { salonId, isActive: true },
    orderBy: { price: "asc" },
  });

  // Fetch active memberships
  const memberships = await db.membership.findMany({
    where: { salonId },
    include: {
      client: true,
      tier: true,
    },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  const activeMemberships = memberships.filter((m) => m.status === "ACTIVE");
  const cancelledMemberships = memberships.filter((m) => m.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Membership Management</h1>
        <p className="text-gray-600">Manage membership tiers and subscriber accounts</p>
      </div>

      {/* Membership Tiers Section */}
      <div className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Membership Tiers</h2>
          {session.user.role === "OWNER" && (
            <Link
              href="/dashboard/memberships/tiers/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create Tier
            </Link>
          )}
        </div>

        {tiers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="mb-4 text-gray-600">No membership tiers created yet.</p>
            {session.user.role === "OWNER" && (
              <Link
                href="/dashboard/memberships/tiers/new"
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create Your First Tier
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => {
              const tierMemberCount = activeMemberships.filter((m) => m.tierId === tier.id).length;
              const benefits = tier.benefits as Record<string, any>;

              return (
                <div
                  key={tier.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
                  <p className="mb-4 text-3xl font-bold text-blue-600">
                    ${Number(tier.price).toFixed(2)}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    {tierMemberCount} active {tierMemberCount === 1 ? "member" : "members"}
                  </p>
                  {benefits && Object.keys(benefits).length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-semibold">Benefits:</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {Object.entries(benefits).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                              {key}: {String(value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.user.role === "OWNER" && (
                    <Link
                      href={`/dashboard/memberships/tiers/${tier.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit Tier →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Memberships */}
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">
          Active Memberships ({activeMemberships.length})
        </h2>

        {activeMemberships.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No active memberships.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeMemberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/clients/${membership.clientId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {membership.client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{membership.tier.name}</td>
                    <td className="px-6 py-4 text-gray-900">
                      ${Number(membership.tier.price).toFixed(2)}/mo
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(membership.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/memberships/${membership.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancelled Memberships */}
      {cancelledMemberships.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">
            Cancelled Memberships ({cancelledMemberships.length})
          </h2>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cancelledMemberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/clients/${membership.clientId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {membership.client.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{membership.tier.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(membership.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
