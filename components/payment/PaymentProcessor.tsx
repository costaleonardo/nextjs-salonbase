"use client";

import { useState } from "react";
import { PaymentSourceSelector, PaymentSourceData } from "./PaymentSourceSelector";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { processPayment } from "@/app/actions/payments";

interface PaymentProcessorProps {
  appointmentId: string;
  amount: number;
  availableGiftCertificates?: Array<{ code: string; balance: number }>;
  savedCards?: Array<{ id: string; last4: string; brand: string }>;
  onPaymentComplete?: (result: { success: boolean; paymentId?: string; error?: string }) => void;
  onCancel?: () => void;
}

/**
 * Complete Payment Processor Component
 *
 * Orchestrates the entire payment flow:
 * 1. Payment source selection (with gift certificate priority)
 * 2. Explicit user confirmation
 * 3. Payment processing with retry logic
 * 4. Status display and error handling
 */
export function PaymentProcessor({
  appointmentId,
  amount,
  availableGiftCertificates = [],
  savedCards = [],
  onPaymentComplete,
  onCancel,
}: PaymentProcessorProps) {
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<PaymentSourceData | null>(
    null
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  const handlePaymentSourceChange = (source: PaymentSourceData | null) => {
    setSelectedPaymentSource(source);
    setErrorMessage(null);
  };

  const handleProceedToPayment = () => {
    if (!selectedPaymentSource) {
      setErrorMessage("Please select a payment method");
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentSource) {
      setErrorMessage("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage(null);

    try {
      const result = await processPayment({
        appointmentId,
        amount,
        paymentSource: {
          type: selectedPaymentSource.type,
          giftCertificateCode: selectedPaymentSource.giftCertificateCode,
          giftCertificateBalance: selectedPaymentSource.giftCertificateBalance,
          // stripePaymentMethodId would be set for credit card payments
        },
        retryAttempt,
      });

      if (result.success) {
        setPaymentStatus("success");
        setShowConfirmation(false);

        // Call onPaymentComplete callback
        if (onPaymentComplete) {
          onPaymentComplete({
            success: true,
            paymentId: result.data?.paymentId,
          });
        }
      } else {
        setPaymentStatus("failed");
        setErrorMessage(result.error || "Payment failed");
        setShowConfirmation(false);

        // Check if retry is available
        if (result.canRetry) {
          setCanRetry(true);
          setRetryAttempt(result.retryAttempt || 0);
        } else {
          setCanRetry(false);
        }

        if (onPaymentComplete) {
          onPaymentComplete({
            success: false,
            error: result.error,
          });
        }
      }
    } catch (error) {
      setPaymentStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
      setShowConfirmation(false);

      if (onPaymentComplete) {
        onPaymentComplete({
          success: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setErrorMessage(null);
    setCanRetry(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Payment Status Banner */}
      {paymentStatus === "success" && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <div className="flex items-start">
            <span className="mr-3 text-2xl">✓</span>
            <div>
              <div className="font-semibold text-green-900">Payment Successful</div>
              <div className="mt-1 text-sm text-green-800">
                Your payment of {formatCurrency(amount)} has been processed successfully.
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === "failed" && errorMessage && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <div className="flex items-start">
            <span className="mr-3 text-2xl">✗</span>
            <div className="flex-1">
              <div className="font-semibold text-red-900">Payment Failed</div>
              <div className="mt-1 text-sm text-red-800">{errorMessage}</div>
              {canRetry && (
                <button
                  onClick={handleRetry}
                  className="mt-3 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Retry Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentStatus === "processing" && (
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
          <div className="flex items-start">
            <div className="mr-3 animate-spin text-2xl">⟳</div>
            <div>
              <div className="font-semibold text-blue-900">Processing Payment...</div>
              <div className="mt-1 text-sm text-blue-800">
                Please wait while we process your payment. Do not refresh or close this page.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Source Selector */}
      {paymentStatus !== "success" && (
        <>
          <PaymentSourceSelector
            amountDue={amount}
            onSourceChange={handlePaymentSourceChange}
            availableGiftCertificates={availableGiftCertificates}
            savedCards={savedCards}
            disabled={isProcessing || paymentStatus === "processing"}
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isProcessing || paymentStatus === "processing"}
                className="flex-1 rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleProceedToPayment}
              disabled={!selectedPaymentSource || isProcessing || paymentStatus === "processing"}
              className="flex-1 rounded-md bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Continue to Payment
            </button>
          </div>

          {errorMessage && paymentStatus === "idle" && (
            <div className="text-sm text-red-600">{errorMessage}</div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmPayment}
        amount={amount}
        paymentSource={selectedPaymentSource}
        isProcessing={isProcessing}
      />

      {/* Security Notice */}
      {paymentStatus !== "success" && (
        <div className="pt-4 text-center text-xs text-gray-500">
          <div>🔒 Your payment information is secure and encrypted</div>
          <div className="mt-1">All payment decisions are logged for your security</div>
        </div>
      )}
    </div>
  );
}
