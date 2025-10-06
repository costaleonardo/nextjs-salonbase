"use client";

import { useState } from "react";
import { cancelMembership } from "@/app/actions/memberships";
import { useRouter } from "next/navigation";

interface MembershipCancelButtonProps {
  membershipId: string;
}

export default function MembershipCancelButton({ membershipId }: MembershipCancelButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await cancelMembership(membershipId, reason || undefined);

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel membership");
      }

      // Refresh the page to show updated status
      router.refresh();
      setShowConfirm(false);
    } catch (err: any) {
      console.error("Error canceling membership:", err);
      setError(err.message || "Failed to cancel membership");
    } finally {
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Cancel Membership
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h4 className="mb-2 font-semibold text-red-900">
        Are you sure you want to cancel this membership?
      </h4>
      <p className="mb-4 text-sm text-red-700">
        This action cannot be undone. The subscription will be canceled immediately in Stripe.
      </p>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-red-900">
          Cancellation Reason (Optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-red-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
          rows={3}
          placeholder="Why is this membership being canceled?"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Canceling..." : "Confirm Cancellation"}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setReason("");
            setError(null);
          }}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Keep Membership
        </button>
      </div>
    </div>
  );
}
