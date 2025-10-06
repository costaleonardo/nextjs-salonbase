"use client";

import { useState, useEffect } from "react";
import { createMembership, getMembershipTiers } from "@/app/actions/memberships";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { MembershipTier } from "@prisma/client";

interface MembershipSignupProps {
  clientId: string;
  salonId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MembershipSignup({
  clientId,
  salonId,
  onSuccess,
  onCancel,
}: MembershipSignupProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "payment">("select");

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`membership-signup-${clientId}`);
    if (savedProgress) {
      try {
        const { tierId } = JSON.parse(savedProgress);
        if (tierId) {
          setSelectedTierId(tierId);
          setStep("payment");
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      }
    }
  }, [clientId]);

  // Save progress to localStorage
  useEffect(() => {
    if (selectedTierId) {
      localStorage.setItem(
        `membership-signup-${clientId}`,
        JSON.stringify({ tierId: selectedTierId })
      );
    }
  }, [selectedTierId, clientId]);

  // Fetch membership tiers
  useEffect(() => {
    async function fetchTiers() {
      const result = await getMembershipTiers(salonId);
      if (result.success && result.data) {
        setTiers(result.data);
      }
    }
    fetchTiers();
  }, [salonId]);

  const selectedTier = tiers.find((t) => t.id === selectedTierId);

  const handleTierSelect = (tierId: string) => {
    setSelectedTierId(tierId);
    setStep("payment");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTierId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedTierId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message || "Failed to create payment method");
      }

      // Create membership (with retry logic built into server action)
      const result = await createMembership({
        clientId,
        tierId: selectedTierId,
        paymentMethodId: paymentMethod.id,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create membership");
      }

      // Confirm payment if client secret is provided
      if (result.data?.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(result.data.clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message || "Failed to confirm payment");
        }
      }

      // Clear saved progress
      localStorage.removeItem(`membership-signup-${clientId}`);

      // Success!
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Membership signup error:", err);
      setError(err.message || "Failed to create membership");
    } finally {
      setLoading(false);
    }
  };

  if (step === "select") {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h2 className="mb-6 text-2xl font-bold">Choose a Membership Plan</h2>

        {tiers.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">No membership plans available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => {
              const benefits = tier.benefits as Record<string, any>;

              return (
                <div
                  key={tier.id}
                  className="cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-6 transition-colors hover:border-blue-500"
                  onClick={() => handleTierSelect(tier.id)}
                >
                  <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
                  <p className="mb-4 text-3xl font-bold text-blue-600">
                    ${Number(tier.price).toFixed(2)}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </p>

                  {benefits && Object.keys(benefits).length > 0 && (
                    <ul className="mb-4 space-y-2 text-sm text-gray-700">
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

                  <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                    Select Plan
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {onCancel && (
          <div className="mt-6 text-center">
            <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Payment step
  return (
    <div className="mx-auto max-w-lg p-6">
      <button onClick={handleBack} className="mb-4 text-blue-600 hover:underline">
        ← Back to plans
      </button>

      <h2 className="mb-6 text-2xl font-bold">Complete Your Membership</h2>

      {selectedTier && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Selected Plan</p>
          <p className="text-xl font-semibold">{selectedTier.name}</p>
          <p className="text-2xl font-bold text-blue-600">
            ${Number(selectedTier.price).toFixed(2)}
            <span className="text-sm font-normal text-gray-600">/month</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Payment Information
          </label>
          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Your card will be charged ${Number(selectedTier?.price || 0).toFixed(2)} today and
            monthly thereafter until you cancel.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-500">
          By subscribing, you agree to automatic monthly billing. You can cancel anytime from your
          account settings.
        </p>
      </form>
    </div>
  );
}
