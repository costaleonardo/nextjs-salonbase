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
 * - customer.subscription.created: Subscription created
 * - customer.subscription.updated: Subscription updated (renewal, etc.)
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Subscription payment succeeded
 * - invoice.payment_failed: Subscription payment failed
 *
 * Security:
 * - Webhook signature verification (prevents spoofing)
 * - Uses raw request body for signature validation
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { db } from "@/lib/db";
import { PaymentStatus, MembershipStatus } from "@prisma/client";

/**
 * Webhook endpoint configuration
 * - Must use raw body for signature verification
 * - POST requests only
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Missing stripe-signature header");
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const error = err as Error;
      console.error(`[Stripe Webhook] Signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Log webhook event received
    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Handle successful payment intent
 * Updates payment status to COMPLETED and creates audit log
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`);

  try {
    // Find payment by Stripe Payment Intent ID
    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: { appointment: true },
    });

    if (!payment) {
      console.warn(`[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status to COMPLETED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          metadata: {
            ...((payment.metadata as object) || {}),
            stripePaymentIntentStatus: paymentIntent.status,
            completedAt: new Date().toISOString(),
          },
        },
      });

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
            paymentMethod:
              typeof paymentIntent.payment_method === "string"
                ? paymentIntent.payment_method
                : paymentIntent.payment_method?.id || null,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as COMPLETED (appointment: ${payment.appointmentId})`
      );
    });
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling payment_intent.succeeded for ${paymentIntent.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle failed payment intent
 * Updates payment status to FAILED and creates audit log
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  try {
    // Find payment by Stripe Payment Intent ID
    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: { appointment: true },
    });

    if (!payment) {
      console.warn(`[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Get error details from last payment error
    const errorMessage = paymentIntent.last_payment_error?.message || "Unknown error";
    const errorCode = paymentIntent.last_payment_error?.code || "unknown";

    // Update payment status to FAILED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            stripePaymentIntentStatus: paymentIntent.status,
            failedAt: new Date().toISOString(),
            errorMessage,
            errorCode,
          },
        },
      });

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
      });

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as FAILED (appointment: ${payment.appointmentId}). Error: ${errorMessage}`
      );
    });
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling payment_intent.payment_failed for ${paymentIntent.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle refunded charge
 * Updates payment status to REFUNDED and creates audit log
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Stripe Webhook] Processing charge.refunded: ${charge.id}`);

  try {
    // Find payment by Stripe Payment Intent ID (charge.payment_intent)
    const paymentIntentId =
      typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

    if (!paymentIntentId) {
      console.warn(`[Stripe Webhook] No payment_intent found for charge: ${charge.id}`);
      return;
    }

    const payment = await db.payment.findUnique({
      where: { stripePaymentId: paymentIntentId },
      include: { appointment: true },
    });

    if (!payment) {
      console.warn(`[Stripe Webhook] Payment not found for PaymentIntent: ${paymentIntentId}`);
      return;
    }

    // Calculate refunded amount (in cents to dollars)
    const refundedAmount = charge.amount_refunded / 100;

    // Update payment status to REFUNDED
    await db.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          metadata: {
            ...((payment.metadata as object) || {}),
            refundedAt: new Date().toISOString(),
            refundedAmount,
            chargeId: charge.id,
          },
        },
      });

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
      });

      console.log(
        `[Stripe Webhook] Payment ${payment.id} marked as REFUNDED (appointment: ${payment.appointmentId}). Amount: $${refundedAmount}`
      );
    });
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling charge.refunded for ${charge.id}:`, error);
    throw error;
  }
}

/**
 * Handle subscription created
 * Confirms the membership was created successfully
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing customer.subscription.created: ${subscription.id}`);

  try {
    // Find membership by Stripe subscription ID
    const membership = await db.membership.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { client: true, tier: true },
    });

    if (!membership) {
      console.warn(`[Stripe Webhook] Membership not found for subscription: ${subscription.id}`);
      return;
    }

    // Ensure status is ACTIVE
    if (membership.status !== MembershipStatus.ACTIVE) {
      await db.membership.update({
        where: { id: membership.id },
        data: { status: MembershipStatus.ACTIVE },
      });
    }

    console.log(
      `[Stripe Webhook] Subscription ${subscription.id} confirmed active for membership ${membership.id}`
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling customer.subscription.created for ${subscription.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle subscription updated
 * Updates membership status based on subscription changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing customer.subscription.updated: ${subscription.id}`);

  try {
    // Find membership by Stripe subscription ID
    const membership = await db.membership.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { client: true, tier: true },
    });

    if (!membership) {
      console.warn(`[Stripe Webhook] Membership not found for subscription: ${subscription.id}`);
      return;
    }

    // Update membership based on subscription status
    let newStatus: MembershipStatus = membership.status;

    switch (subscription.status) {
      case "active":
      case "trialing":
        newStatus = MembershipStatus.ACTIVE;
        break;
      case "canceled":
      case "unpaid":
        newStatus = MembershipStatus.CANCELLED;
        break;
      case "past_due":
        // Keep existing status but log warning
        console.warn(
          `[Stripe Webhook] Subscription ${subscription.id} is past_due for membership ${membership.id}`
        );
        break;
    }

    // Update membership if status changed
    if (newStatus !== membership.status) {
      await db.membership.update({
        where: { id: membership.id },
        data: {
          status: newStatus,
          ...(newStatus === MembershipStatus.CANCELLED && { endDate: new Date() }),
        },
      });

      console.log(`[Stripe Webhook] Membership ${membership.id} status updated to ${newStatus}`);
    }
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling customer.subscription.updated for ${subscription.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle subscription deleted/canceled
 * Marks membership as CANCELLED
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] Processing customer.subscription.deleted: ${subscription.id}`);

  try {
    // Find membership by Stripe subscription ID
    const membership = await db.membership.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { client: true, tier: true },
    });

    if (!membership) {
      console.warn(`[Stripe Webhook] Membership not found for subscription: ${subscription.id}`);
      return;
    }

    // Mark membership as CANCELLED
    await db.membership.update({
      where: { id: membership.id },
      data: {
        status: MembershipStatus.CANCELLED,
        endDate: new Date(),
      },
    });

    console.log(
      `[Stripe Webhook] Membership ${membership.id} marked as CANCELLED (subscription deleted)`
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling customer.subscription.deleted for ${subscription.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle successful invoice payment
 * Logs successful recurring billing
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Processing invoice.payment_succeeded: ${invoice.id}`);

  try {
    // Only process invoices with subscriptions
    if (!invoice.subscription) {
      return;
    }

    const subscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;

    // Find membership by subscription ID
    const membership = await db.membership.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { client: true, tier: true },
    });

    if (!membership) {
      console.warn(`[Stripe Webhook] Membership not found for subscription: ${subscriptionId}`);
      return;
    }

    // Ensure membership is ACTIVE
    if (membership.status !== MembershipStatus.ACTIVE) {
      await db.membership.update({
        where: { id: membership.id },
        data: { status: MembershipStatus.ACTIVE },
      });
    }

    console.log(
      `[Stripe Webhook] Invoice ${invoice.id} paid for membership ${membership.id}. Amount: $${(invoice.amount_paid / 100).toFixed(2)}`
    );

    // TODO: Send receipt email to client
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling invoice.payment_succeeded for ${invoice.id}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle failed invoice payment
 * Logs failed recurring billing
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Processing invoice.payment_failed: ${invoice.id}`);

  try {
    // Only process invoices with subscriptions
    if (!invoice.subscription) {
      return;
    }

    const subscriptionId =
      typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;

    // Find membership by subscription ID
    const membership = await db.membership.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      include: { client: true, tier: true },
    });

    if (!membership) {
      console.warn(`[Stripe Webhook] Membership not found for subscription: ${subscriptionId}`);
      return;
    }

    console.warn(
      `[Stripe Webhook] Invoice ${invoice.id} payment failed for membership ${membership.id}. Amount: $${(invoice.amount_due / 100).toFixed(2)}`
    );

    // TODO: Send payment failure notification to client
    // Note: Stripe will handle retry logic automatically based on settings
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling invoice.payment_failed for ${invoice.id}:`,
      error
    );
    throw error;
  }
}
