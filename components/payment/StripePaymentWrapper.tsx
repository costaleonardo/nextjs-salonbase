"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import StripeCardInput from "./StripeCardInput";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface StripePaymentWrapperProps {
  appointmentId: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

/**
 * Wrapper component that initializes Stripe Elements and creates a Payment Intent
 *
 * This component:
 * 1. Creates a Payment Intent via API
 * 2. Initializes Stripe Elements with the client secret
 * 3. Renders the card input form
 * 4. Handles 3D Secure authentication automatically
 */
export default function StripePaymentWrapper({
  appointmentId,
  amount,
  onSuccess,
  onError,
}: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create Payment Intent on mount
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentId,
            amount,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create payment intent");
        }

        if (!data.clientSecret) {
          throw new Error("No client secret returned from server");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize payment";
        setError(message);
        onError(message);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [appointmentId, amount, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        <p className="font-medium">Payment initialization failed</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
        <p>Unable to initialize payment. Please try again.</p>
      </div>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb", // blue-600
        colorBackground: "#ffffff",
        colorText: "#1f2937", // gray-800
        colorDanger: "#dc2626", // red-600
        fontFamily: "system-ui, -apple-system, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
        // Mobile optimizations
        fontSizeBase: "16px", // Prevents zoom on iOS
        fontSizeSm: "14px",
      },
    },
    // Loader settings
    loader: "auto",
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <StripeCardInput
        onSuccess={onSuccess}
        onError={onError}
        amount={amount}
        appointmentId={appointmentId}
      />
    </Elements>
  );
}
