import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import MembershipCancelButton from "@/components/MembershipCancelButton";

export default async function MembershipDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "STAFF") {
    redirect("/portal");
  }

  const membership = await db.membership.findUnique({
    where: { id: membershipId },
    include: {
      client: true,
      tier: true,
      salon: true,
    },
  });

  if (!membership) {
    notFound();
  }

  // Check if user has access to this membership
  if (session.user.salonId !== membership.salonId) {
    redirect("/dashboard/memberships");
  }

  const benefits = membership.tier.benefits as Record<string, any>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Membership Details</h1>
        <p className="text-gray-600">View and manage membership subscription</p>
      </div>

      {/* Membership Status */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Status</h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              membership.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : membership.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {membership.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Client</p>
            <p className="text-lg font-medium">{membership.client.name}</p>
            {membership.client.email && (
              <p className="text-sm text-gray-600">{membership.client.email}</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600">Membership Tier</p>
            <p className="text-lg font-medium">{membership.tier.name}</p>
            <p className="text-sm text-gray-600">
              ${Number(membership.tier.price).toFixed(2)}/month
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-lg font-medium">
              {new Date(membership.startDate).toLocaleDateString()}
            </p>
          </div>

          {membership.endDate && (
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="text-lg font-medium">
                {new Date(membership.endDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {membership.stripeSubscriptionId && (
            <div>
              <p className="text-sm text-gray-600">Stripe Subscription ID</p>
              <p className="font-mono text-sm text-gray-800">{membership.stripeSubscriptionId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Membership Benefits */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Membership Benefits</h2>

        {benefits && Object.keys(benefits).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(benefits).map(([key, value]) => (
              <li key={key} className="flex items-start">
                <span className="mr-3 text-green-600">✓</span>
                <span>
                  <span className="font-medium">{key}:</span> {String(value)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No benefits listed.</p>
        )}
      </div>

      {/* Actions */}
      {membership.status === "ACTIVE" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Actions</h2>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Cancel Membership</h3>
              <p className="mb-4 text-sm text-gray-600">
                Canceling will stop future billing. The membership will remain active until the end
                of the current billing period.
              </p>
              <MembershipCancelButton membershipId={membership.id} />
            </div>
          </div>
        </div>
      )}

      {membership.status === "CANCELLED" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-yellow-800">
            This membership has been cancelled and is no longer active.
          </p>
        </div>
      )}
    </div>
  );
}
