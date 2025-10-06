"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PaymentResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    status: "success" | "failed" | "requires_action";
    message?: string;
    paymentId?: string;
    amount?: number;
    canRetry?: boolean;
  };
  onRetry?: () => void;
}

/**
 * Payment result dialog
 *
 * Shows the result of a payment attempt with appropriate messaging
 * and actions based on the outcome.
 */
export default function PaymentResultDialog({
  isOpen,
  onClose,
  result,
  onRetry,
}: PaymentResultDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (result.status) {
      case "success":
        return <CheckCircle className="mx-auto h-16 w-16 text-green-500" />;
      case "failed":
        return <XCircle className="mx-auto h-16 w-16 text-red-500" />;
      case "requires_action":
        return <AlertCircle className="mx-auto h-16 w-16 text-yellow-500" />;
    }
  };

  const getTitle = () => {
    switch (result.status) {
      case "success":
        return "Payment Successful";
      case "failed":
        return "Payment Failed";
      case "requires_action":
        return "Additional Action Required";
    }
  };

  const getMessage = () => {
    if (result.message) {
      return result.message;
    }

    switch (result.status) {
      case "success":
        return `Your payment of $${result.amount?.toFixed(2)} has been processed successfully.`;
      case "failed":
        return "We were unable to process your payment. Please try again or use a different payment method.";
      case "requires_action":
        return "Your payment requires additional authentication. Please complete the verification process.";
    }
  };

  const getBackgroundColor = () => {
    switch (result.status) {
      case "success":
        return "bg-green-50";
      case "failed":
        return "bg-red-50";
      case "requires_action":
        return "bg-yellow-50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
          onClick={result.status === "success" ? onClose : undefined}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:p-8">
          {/* Icon */}
          <div
            className={`${getBackgroundColor()} mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full p-4`}
          >
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">{getTitle()}</h2>

          {/* Message */}
          <p className="mb-6 text-center text-gray-600">{getMessage()}</p>

          {/* Payment ID (for success) */}
          {result.status === "success" && result.paymentId && (
            <div className="mb-6 rounded-lg bg-gray-50 p-3">
              <p className="text-center text-xs text-gray-500">Payment ID: {result.paymentId}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {result.status === "success" && (
              <button
                onClick={onClose}
                className="min-h-[44px] w-full touch-manipulation rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
              >
                Done
              </button>
            )}

            {result.status === "failed" && (
              <>
                {result.canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    className="min-h-[44px] w-full touch-manipulation rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="min-h-[44px] w-full touch-manipulation rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
                >
                  {result.canRetry ? "Use Different Payment Method" : "Close"}
                </button>
              </>
            )}

            {result.status === "requires_action" && (
              <button
                onClick={onClose}
                className="min-h-[44px] w-full touch-manipulation rounded-lg bg-yellow-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
              >
                Complete Verification
              </button>
            )}
          </div>

          {/* Helper text for failed payments */}
          {result.status === "failed" && (
            <p className="mt-4 text-center text-xs text-gray-500">
              If the problem persists, please contact your bank or try a different payment method.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
