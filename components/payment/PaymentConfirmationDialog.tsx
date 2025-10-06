"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentDetails: {
    amount: number;
    method: "CREDIT_CARD" | "GIFT_CERTIFICATE" | "CASH" | "OTHER";
    giftCertificateCode?: string;
    giftCertificateBalance?: number;
    cardLast4?: string;
  };
  appointmentDetails: {
    clientName: string;
    serviceName: string;
    dateTime: string;
  };
}

/**
 * Payment confirmation dialog
 *
 * CRITICAL: This dialog ensures explicit user confirmation before charging credit cards.
 * This is a key requirement to prevent accidental charges.
 */
export default function PaymentConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  paymentDetails,
  appointmentDetails,
}: PaymentConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentDetails.method) {
      case "GIFT_CERTIFICATE":
        return (
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-semibold">Gift Certificate</p>
            <p className="mt-1 text-sm text-gray-500">Code: {paymentDetails.giftCertificateCode}</p>
            {paymentDetails.giftCertificateBalance !== undefined && (
              <p className="text-sm text-gray-500">
                Remaining Balance: ${paymentDetails.giftCertificateBalance.toFixed(2)}
              </p>
            )}
          </div>
        );
      case "CREDIT_CARD":
        return (
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-semibold">Credit Card</p>
            {paymentDetails.cardLast4 && (
              <p className="mt-1 text-sm text-gray-500">•••• {paymentDetails.cardLast4}</p>
            )}
          </div>
        );
      case "CASH":
        return (
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-semibold">Cash</p>
          </div>
        );
      case "OTHER":
        return (
          <div>
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="font-semibold">Other</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 transition-colors hover:text-gray-600"
            disabled={isConfirming}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Confirm Payment</h2>
            <p className="mt-2 text-gray-600">
              Please review the payment details before confirming
            </p>
          </div>

          {/* Appointment Details */}
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-semibold">{appointmentDetails.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Service</p>
              <p className="font-semibold">{appointmentDetails.serviceName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold">{appointmentDetails.dateTime}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6 space-y-3 rounded-lg bg-blue-50 p-4">
            {getPaymentMethodDisplay()}

            <div className="border-t border-blue-200 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Amount to Charge</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${paymentDetails.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for Credit Card */}
          {paymentDetails.method === "CREDIT_CARD" && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This will charge the credit card immediately. This
                action cannot be undone without processing a refund.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="min-h-[44px] flex-1 touch-manipulation rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="min-h-[44px] flex-1 touch-manipulation rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isConfirming ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
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
                "Confirm Payment"
              )}
            </button>
          </div>

          {/* Security notice */}
          <p className="mt-4 text-center text-xs text-gray-500">
            All transactions are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}
