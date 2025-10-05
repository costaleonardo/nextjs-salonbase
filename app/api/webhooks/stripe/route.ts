/**
 * Stripe Webhook Handler
 *
 * This endpoint receives webhook events from Stripe for payment processing.
 * CRITICAL: All payment status updates must create audit log entries.
 *
 * Handled events:
 * - payment_intent.succeeded: Payment completed successfully
 * - payment_intent.payment_failed: Payment failed
 * - charge.refunded: Payment was refunded
 *
 * Security:
 * - Webhook signature verification (prevents spoofing)
 * - Uses raw request body for signature validation
 */

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe"
import { db } from "@/lib/db"
import { PaymentStatus } from "@prisma/client"

/**
 * Webhook endpoint configuration
 * - Must use raw body for signature verification
 * - POST requests only
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("[Stripe Webhook] Missing stripe-signature header")
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      )
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured")
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      const error = err as Error
      console.error(`[Stripe Webhook] Signature verification failed: ${error.message}`)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    // Log webhook event received
    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`)

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment intent
 * Updates payment status to COMPLETED and creates audit log
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`)

  try {
    // Find payment by Stripe Payment Intent ID
    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: { appointment: true },
    })

    if (!payment) {
      console.warn(
        `[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntent.id}`
      )
      return
    }

    // Update payment status to COMPLETED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          metadata: {
            ...(payment.metadata as object || {}),
            stripePaymentIntentStatus: paymentIntent.status,
            completedAt: new Date().toISOString(),
          },
        },
      })

      // Create audit log entry
      await tx.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: "payment_succeeded",
          details: {
            event: "payment_intent.succeeded",
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethod: typeof paymentIntent.payment_method === "string"
              ? paymentIntent.payment_method
              : paymentIntent.payment_method?.id || null,
            timestamp: new Date().toISOString(),
          },
        },
      })

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as COMPLETED (appointment: ${payment.appointmentId})`
      )
    })
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling payment_intent.succeeded for ${paymentIntent.id}:`,
      error
    )
    throw error
  }
}

/**
 * Handle failed payment intent
 * Updates payment status to FAILED and creates audit log
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`)

  try {
    // Find payment by Stripe Payment Intent ID
    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: { appointment: true },
    })

    if (!payment) {
      console.warn(
        `[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntent.id}`
      )
      return
    }

    // Get error details from last payment error
    const errorMessage = paymentIntent.last_payment_error?.message || "Unknown error"
    const errorCode = paymentIntent.last_payment_error?.code || "unknown"

    // Update payment status to FAILED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...(payment.metadata as object || {}),
            stripePaymentIntentStatus: paymentIntent.status,
            failedAt: new Date().toISOString(),
            errorMessage,
            errorCode,
          },
        },
      })

      // Create audit log entry
      await tx.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: "payment_failed",
          details: {
            event: "payment_intent.payment_failed",
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            errorMessage,
            errorCode,
            timestamp: new Date().toISOString(),
          },
        },
      })

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as FAILED (appointment: ${payment.appointmentId}). Error: ${errorMessage}`
      )
    })
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling payment_intent.payment_failed for ${paymentIntent.id}:`,
      error
    )
    throw error
  }
}

/**
 * Handle refunded charge
 * Updates payment status to REFUNDED and creates audit log
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Stripe Webhook] Processing charge.refunded: ${charge.id}`)

  try {
    // Find payment by Stripe Payment Intent ID (charge.payment_intent)
    const paymentIntentId = typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id

    if (!paymentIntentId) {
      console.warn(
        `[Stripe Webhook] No payment_intent found for charge: ${charge.id}`
      )
      return
    }

    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntentId },
      include: { appointment: true },
    })

    if (!payment) {
      console.warn(
        `[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntentId}`
      )
      return
    }

    // Calculate refunded amount (in cents to dollars)
    const refundedAmount = charge.amount_refunded / 100

    // Update payment status to REFUNDED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          metadata: {
            ...(payment.metadata as object || {}),
            refundedAt: new Date().toISOString(),
            refundedAmount,
            chargeId: charge.id,
          },
        },
      })

      // Create audit log entry
      await tx.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: "payment_refunded",
          details: {
            event: "charge.refunded",
            chargeId: charge.id,
            paymentIntentId,
            amountRefunded: refundedAmount,
            currency: charge.currency,
            refundReason: charge.refunds?.data[0]?.reason || "unknown",
            timestamp: new Date().toISOString(),
          },
        },
      })

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as REFUNDED (appointment: ${payment.appointmentId}). Amount: $${refundedAmount}`
      )
    })
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling charge.refunded for ${charge.id}:`,
      error
    )
    throw error
  }
}
