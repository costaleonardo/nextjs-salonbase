"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripePaymentElementOptions } from "@stripe/stripe-js";
import { confirmStripePayment } from "@/app/actions/payments";

interface StripeCardInputProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
  appointmentId: string;
}

/**
 * Mobile-optimized Stripe card input component using Payment Element
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - 3D Secure (SCA) authentication support
 * - Touch-optimized input fields
 * - Autofill support
 * - Real-time validation
 */
export default function StripeCardInput({
  onSuccess,
  onError,
  amount,
  appointmentId,
}: StripeCardInputProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet. Please try again.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment on the client
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/appointments?payment=success`,
        },
        redirect: "if_required", // Only redirect if required for 3D Secure
      });

      if (error) {
        // Payment failed
        setErrorMessage(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - now confirm it on the server
        const result = await confirmStripePayment({
          appointmentId,
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!result.success) {
          setErrorMessage(result.error || "Failed to confirm payment");
          onError(result.error || "Failed to confirm payment");
        } else {
          onSuccess(paymentIntent.id);
        }
      } else {
        // Payment requires additional action (shouldn't happen with redirect: 'if_required')
        setErrorMessage("Payment requires additional authentication");
        onError("Payment requires additional authentication");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: {
      type: "accordion",
      defaultCollapsed: false,
      radios: true,
      spacedAccordionItems: false,
    },
    // Mobile optimization
    fields: {
      billingDetails: {
        address: {
          country: "never", // Simplify for mobile
        },
      },
    },
    // Terms display
    terms: {
      card: "never",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <PaymentElement options={paymentElementOptions} className="mb-4" />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Amount to charge:</span>
          <span className="text-lg font-semibold text-gray-900">${amount.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="min-h-[44px] w-full touch-manipulation rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 sm:text-lg" // Touch target optimization
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg
              className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
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
            Processing...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Your payment is secured by Stripe. Your card details are encrypted and never stored on our
        servers.
      </p>
    </form>
  );
}
