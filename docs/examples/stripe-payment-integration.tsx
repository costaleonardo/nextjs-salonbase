/**
 * Example: Integrating Stripe Payment Flow
 *
 * This example shows how to integrate the Stripe payment components
 * into an appointment payment page.
 */

"use client";

import { useState } from "react";
import StripePaymentWrapper from "@/components/payment/StripePaymentWrapper";
import PaymentResultDialog from "@/components/payment/PaymentResultDialog";

export default function AppointmentPaymentPage({
  appointment,
}: {
  appointment: {
    id: string;
    clientName: string;
    serviceName: string;
    amount: number;
  };
}) {
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: "success" | "failed" | "requires_action";
    message?: string;
    paymentId?: string;
  } | null>(null);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentResult({
      status: "success",
      paymentId: paymentIntentId,
      message: "Payment processed successfully!",
    });
    setShowPaymentResult(true);

    // Optional: Redirect to confirmation page
    // router.push('/dashboard/appointments?payment=success')
  };

  const handlePaymentError = (error: string) => {
    setPaymentResult({
      status: "failed",
      message: error,
    });
    setShowPaymentResult(true);
  };

  const handleRetry = () => {
    setShowPaymentResult(false);
    setPaymentResult(null);
    // Payment form will be shown again
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Complete Payment</h1>

      {/* Appointment Summary */}
      <div className="mb-6 rounded-lg bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Appointment Details</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Client:</span>
            <span className="font-medium">{appointment.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium">{appointment.serviceName}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold">${appointment.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Form */}
      <StripePaymentWrapper
        appointmentId={appointment.id}
        amount={appointment.amount}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {/* Payment Result Dialog */}
      {paymentResult && (
        <PaymentResultDialog
          isOpen={showPaymentResult}
          onClose={() => setShowPaymentResult(false)}
          result={paymentResult}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

/**
 * Example: Using Payment Confirmation Dialog
 *
 * Shows how to add explicit confirmation before charging
 */

import PaymentConfirmationDialog from "@/components/payment/PaymentConfirmationDialog";

export function PaymentWithConfirmation({
  appointment,
  paymentSource,
}: {
  appointment: any;
  paymentSource: {
    type: "CREDIT_CARD";
    cardLast4: string;
  };
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      // Process payment here
      // ...
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isProcessing}
        className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Review & Pay"}
      </button>

      <PaymentConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmPayment}
        paymentDetails={{
          amount: appointment.service.price,
          method: "CREDIT_CARD",
          cardLast4: paymentSource.cardLast4,
        }}
        appointmentDetails={{
          clientName: appointment.client.name,
          serviceName: appointment.service.name,
          dateTime: new Date(appointment.datetime).toLocaleString(),
        }}
      />
    </>
  );
}

/**
 * Example: Server-side Payment Intent Creation
 *
 * Shows how to create Payment Intent from a Server Action
 */

// app/actions/custom-payment.ts
("use server");

import { stripe } from "@/lib/stripe";

export async function createCustomPaymentIntent(appointmentId: string, amount: number) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        appointmentId,
        source: "salonbase_mvp",
      },
    });

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    };
  }
}

/**
 * Example: Complete Payment Flow with Gift Certificate Check
 *
 * Shows how to check for gift certificates BEFORE showing credit card option
 */

import { checkGiftCertificateBalance } from "@/app/actions/gift-certificates";
import { processPayment } from "@/app/actions/payments";

export function CompletePaymentFlow({
  appointmentId,
  amount,
}: {
  appointmentId: string;
  amount: number;
}) {
  const [giftCertCode, setGiftCertCode] = useState("");
  const [giftCertBalance, setGiftCertBalance] = useState<number | null>(null);
  const [showCreditCard, setShowCreditCard] = useState(false);

  const handleCheckGiftCert = async () => {
    const result = await checkGiftCertificateBalance(giftCertCode);
    if (result.success && result.data) {
      setGiftCertBalance(Number(result.data.balance));
    }
  };

  const handlePayWithGiftCert = async () => {
    const result = await processPayment({
      appointmentId,
      amount,
      paymentSource: {
        type: "GIFT_CERTIFICATE",
        giftCertificateCode: giftCertCode,
      },
    });

    if (result.success) {
      // Payment successful
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Check for Gift Certificate */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Have a Gift Certificate?</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={giftCertCode}
            onChange={(e) => setGiftCertCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            onClick={handleCheckGiftCert}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Check
          </button>
        </div>
        {giftCertBalance !== null && (
          <div className="mt-3 text-sm">
            Balance: ${giftCertBalance.toFixed(2)}
            {giftCertBalance >= amount && (
              <button
                onClick={handlePayWithGiftCert}
                className="ml-4 rounded bg-green-600 px-4 py-2 text-white"
              >
                Pay with Gift Certificate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Credit Card Option (only if no gift cert or insufficient balance) */}
      {(!giftCertBalance || giftCertBalance < amount) && (
        <div>
          <button
            onClick={() => setShowCreditCard(true)}
            className="w-full rounded-lg border-2 border-blue-600 py-3 text-blue-600"
          >
            Pay with Credit Card
          </button>

          {showCreditCard && (
            <div className="mt-4">
              <StripePaymentWrapper
                appointmentId={appointmentId}
                amount={amount}
                onSuccess={(id) => console.log("Payment successful:", id)}
                onError={(err) => console.error("Payment failed:", err)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
