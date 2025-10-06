"use client";

import { useEffect, useState } from "react";
import { getMembershipTiers } from "@/app/actions/memberships";
import type { MembershipTier } from "@prisma/client";

interface MembershipBenefitsDisplayProps {
  salonId: string;
  title?: string;
  compact?: boolean;
}

export default function MembershipBenefitsDisplay({
  salonId,
  title = "Membership Plans",
  compact = false,
}: MembershipBenefitsDisplayProps) {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTiers() {
      setLoading(true);
      const result = await getMembershipTiers(salonId);
      if (result.success && result.data) {
        setTiers(result.data);
      }
      setLoading(false);
    }
    fetchTiers();
  }, [salonId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return null; // Don't show anything if no tiers available
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">{title}</h3>
        <p className="mb-3 text-sm text-blue-800">
          Join our membership program for exclusive benefits!
        </p>
        <div className="space-y-2">
          {tiers.map((tier) => {
            const benefits = tier.benefits as Record<string, any>;
            return (
              <div key={tier.id} className="text-sm">
                <span className="font-medium text-blue-900">{tier.name}</span>
                {" - "}
                <span className="text-blue-800">${Number(tier.price).toFixed(2)}/month</span>
                {benefits && Object.keys(benefits).length > 0 && (
                  <div className="mt-1 text-xs text-blue-700">
                    {Object.entries(benefits)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <div key={key}>
                          • {key}: {String(value)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{title}</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const benefits = tier.benefits as Record<string, any>;

          return (
            <div
              key={tier.id}
              className="rounded-lg border-2 border-gray-200 bg-white p-6 transition-colors hover:border-blue-500"
            >
              <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
              <p className="mb-4 text-3xl font-bold text-blue-600">
                ${Number(tier.price).toFixed(2)}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>

              {benefits && Object.keys(benefits).length > 0 && (
                <ul className="space-y-2 text-sm text-gray-700">
                  {Object.entries(benefits).map(([key, value]) => (
                    <li key={key} className="flex items-start">
                      <span className="mr-2 text-green-600">✓</span>
                      <span>
                        {key}: {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Ask our staff about membership benefits during your next visit!
      </p>
    </div>
  );
}
