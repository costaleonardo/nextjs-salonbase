"use client"

import { format } from "date-fns"
import type { GiftCertificate } from "@prisma/client"

interface GiftCertificateCardProps {
  certificate: GiftCertificate
}

export function GiftCertificateCard({ certificate }: GiftCertificateCardProps) {
  const isExpired = certificate.expiresAt && certificate.expiresAt < new Date()
  const isExpiringSoon =
    certificate.expiresAt &&
    !isExpired &&
    certificate.expiresAt.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 // 30 days

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-medium text-gray-900">
              {certificate.code}
            </p>
            {isExpiringSoon && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Expiring Soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Original: ${certificate.originalAmount.toFixed(2)}
          </p>
          {certificate.expiresAt && (
            <p className="mt-1 text-xs text-gray-500">
              Expires: {format(certificate.expiresAt, "MMM d, yyyy")}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ${certificate.balance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
      </div>
    </div>
  )
}
