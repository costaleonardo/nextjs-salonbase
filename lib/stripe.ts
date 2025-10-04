/**
 * Stripe client initialization
 *
 * This file provides both server-side and client-side Stripe instances:
 * - Server-side: Full Stripe SDK for payment processing, webhooks, etc.
 * - Client-side: Stripe.js for Elements and Payment Intents
 */

import Stripe from "stripe"
import { loadStripe, Stripe as StripeJS } from "@stripe/stripe-js"

// ============================================================================
// Server-side Stripe client (for API routes, Server Actions, webhooks)
// ============================================================================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set in environment variables. " +
    "Please add it to .env.local for development or environment settings for production."
  )
}

/**
 * Server-side Stripe client instance
 * Use this for all backend payment operations:
 * - Creating Payment Intents
 * - Processing refunds
 * - Managing subscriptions
 * - Handling webhooks
 *
 * @example
 * ```typescript
 * import { stripe } from "@/lib/stripe"
 *
 * const paymentIntent = await stripe.paymentIntents.create({
 *   amount: 5000,
 *   currency: "usd",
 * })
 * ```
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia",
  typescript: true,
  appInfo: {
    name: "SalonBase MVP",
    version: "1.0.0",
  },
})

// ============================================================================
// Client-side Stripe.js loader (for payment forms, Elements)
// ============================================================================

let stripePromise: Promise<StripeJS | null>

/**
 * Get the client-side Stripe.js instance
 * This lazy-loads the Stripe.js library only when needed
 *
 * Use this in client components for:
 * - Stripe Elements (card input, etc.)
 * - Confirming Payment Intents
 * - Tokenizing payment methods
 */
export function getStripe(): Promise<StripeJS | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. " +
        "Client-side Stripe features will not work."
      )
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

// ============================================================================
// Stripe configuration constants
// ============================================================================

/**
 * Stripe webhook signature secret
 * Used to verify webhook events are from Stripe
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ""

/**
 * Currency for all transactions (can be made configurable per salon later)
 */
export const DEFAULT_CURRENCY = "usd"

/**
 * Minimum charge amount in cents (Stripe requirement: $0.50)
 */
export const MINIMUM_CHARGE_AMOUNT = 50
