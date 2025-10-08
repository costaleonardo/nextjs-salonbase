"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

type MobileStripeFormProps = {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  clientSecret: string;
};

/**
 * Mobile-optimized Stripe payment form with fallback
 * Designed for touch interfaces with large targets and clear error messaging
 */
export function MobileStripeForm({
  amount,
  onSuccess,
  onError,
  clientSecret,
}: MobileStripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elementsReady, setElementsReady] = useState(false);
  const [elementsFailed, setElementsFailed] = useState(false);

  // Mobile-optimized CardElement options
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px", // Prevents zoom on iOS
        color: "#111827",
        fontFamily: "system-ui, -apple-system, sans-serif",
        "::placeholder": {
          color: "#9CA3AF",
        },
        lineHeight: "44px", // Match mobile touch target height
      },
      invalid: {
        color: "#DC2626",
        iconColor: "#DC2626",
      },
    },
    hidePostalCode: false, // Keep for fraud prevention
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Payment system not loaded. Please refresh the page.");
      return;
    }

    if (elementsFailed) {
      onError("Card input failed to load. Please try a different payment method.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onError("Card information is missing.");
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        setIsProcessing(false);
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      setIsProcessing(false);
      onError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Display */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="text-sm font-medium text-blue-900">Total Amount</div>
        <div className="text-2xl font-bold text-blue-900">${(amount / 100).toFixed(2)}</div>
      </div>

      {/* Card Element */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Card Information</label>
        <div
          className={`rounded-lg border p-4 ${
            errorMessage ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
          }`}
          style={{ minHeight: "44px" }}
        >
          {!elementsFailed ? (
            <CardElement
              options={cardElementOptions}
              onReady={() => setElementsReady(true)}
              onLoadError={() => {
                setElementsFailed(true);
                onError("Card input failed to load");
              }}
            />
          ) : (
            <div className="text-sm text-red-600">
              Card input failed to load. Please try refreshing the page or use a different payment
              method.
            </div>
          )}
        </div>
        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-2 text-xs text-gray-500">
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>
          Your payment information is encrypted and secure. We never store your card details.
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elementsReady || isProcessing || elementsFailed}
        className="w-full rounded-lg bg-blue-600 px-6 py-4 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: "44px" }}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
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
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </button>

      {/* Powered by Stripe Badge */}
      <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
        <span>Secured by</span>
        <svg className="h-4" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M59.6 12.5c0-6.9-5.6-12.5-12.5-12.5S34.6 5.6 34.6 12.5 40.2 25 47.1 25 59.6 19.4 59.6 12.5z"
            fill="#635BFF"
          />
          <text x="5" y="18" fill="#635BFF" fontSize="14" fontWeight="600">
            Stripe
          </text>
        </svg>
      </div>
    </form>
  );
}

/**
 * Fallback simple card form (non-Stripe Elements)
 * Only used if Stripe Elements fails to load
 */
export function SimpleFallbackCardForm({
  amount,
  onCancel,
}: {
  amount: number;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex gap-2">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-yellow-900">Payment form unavailable</p>
            <p className="mt-1 text-yellow-800">
              Our secure payment form failed to load. Please try refreshing the page or contact us
              to complete your booking.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-1 text-sm font-medium text-gray-700">Total Amount</div>
        <div className="text-2xl font-bold text-gray-900">${(amount / 100).toFixed(2)}</div>
      </div>

      <button
        onClick={onCancel}
        className="w-full rounded-lg bg-gray-200 px-6 py-4 font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
        style={{ minHeight: "44px" }}
      >
        Go Back
      </button>

      <p className="text-center text-xs text-gray-500">
        If this problem persists, please contact support.
      </p>
    </div>
  );
}
