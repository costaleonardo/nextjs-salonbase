"use client"

import { format } from "date-fns"
import type { Membership, MembershipTier } from "@prisma/client"

type MembershipWithTier = Membership & {
  tier: MembershipTier
}

interface MembershipCardProps {
  membership: MembershipWithTier
}

export function MembershipCard({ membership }: MembershipCardProps) {
  const benefits = membership.tier.benefits as { items?: string[] } | null
  const benefitsList = benefits?.items || []

  return (
    <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 p-6 text-white shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-100">Active Membership</p>
          <h2 className="text-2xl font-bold">{membership.tier.name}</h2>
        </div>
        <svg
          className="h-10 w-10 text-purple-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>

      <div className="mb-4 border-t border-purple-400 pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            ${membership.tier.price.toFixed(2)}
          </span>
          <span className="text-purple-100">/month</span>
        </div>
      </div>

      {benefitsList.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-purple-100">Benefits</p>
          <ul className="space-y-1">
            {benefitsList.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-purple-400 pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-100">Started</span>
          <span className="font-medium">{format(membership.startDate, "MMM d, yyyy")}</span>
        </div>
        {membership.endDate && (
          <div className="mt-1 flex justify-between">
            <span className="text-purple-100">Renews</span>
            <span className="font-medium">{format(membership.endDate, "MMM d, yyyy")}</span>
          </div>
        )}
      </div>
    </div>
  )
}
