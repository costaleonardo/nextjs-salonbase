"use client";

import { PaymentSourceData } from "./PaymentSourceSelector";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  paymentSource: PaymentSourceData | null;
  isProcessing: boolean;
}

/**
 * Payment Confirmation Modal
 *
 * Requires explicit user confirmation before processing payment.
 * This is a critical safety measure to prevent accidental charges.
 */
export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  paymentSource,
  isProcessing,
}: PaymentConfirmationModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPaymentSourceDescription = () => {
    if (!paymentSource) return "No payment source selected";

    switch (paymentSource.type) {
      case "GIFT_CERTIFICATE":
        return `Gift Certificate (${paymentSource.giftCertificateCode})`;
      case "CREDIT_CARD":
        return paymentSource.creditCardLast4
          ? `Credit Card ending in ${paymentSource.creditCardLast4}`
          : "Credit Card";
      case "CASH":
        return "Cash";
      case "OTHER":
        return "Other Payment Method";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">Confirm Payment</h2>

        <div className="mb-6 space-y-4">
          <div className="border-t border-b border-gray-200 py-4">
            <div className="mb-2 flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">{getPaymentSourceDescription()}</span>
            </div>
          </div>

          {paymentSource?.type === "GIFT_CERTIFICATE" &&
            paymentSource.giftCertificateBalance !== undefined && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <div className="text-sm text-green-800">
                  <div className="mb-1 font-semibold">Gift Certificate Details:</div>
                  <div>Current Balance: {formatCurrency(paymentSource.giftCertificateBalance)}</div>
                  <div>
                    Amount to Apply:{" "}
                    {formatCurrency(Math.min(amount, paymentSource.giftCertificateBalance))}
                  </div>
                  <div>
                    Remaining Balance:{" "}
                    {formatCurrency(Math.max(0, paymentSource.giftCertificateBalance - amount))}
                  </div>
                </div>
              </div>
            )}

          {paymentSource?.type === "CREDIT_CARD" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-sm text-blue-800">
                <div className="mb-1 font-semibold">⚠️ Credit Card Charge</div>
                <div>Your card will be charged {formatCurrency(amount)} immediately.</div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            By confirming, you authorize this payment to be processed using the selected payment
            method.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
