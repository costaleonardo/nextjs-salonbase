/**
 * Payment Components
 *
 * This module exports all payment-related components for the SalonBase MVP.
 * These components implement the critical payment processing flow with:
 *
 * - Gift certificate priority (always shown first)
 * - Explicit user confirmation before charges
 * - Complete audit trail logging
 * - Automatic rollback on failures
 * - Retry logic with max 2 attempts
 */

export { PaymentSourceSelector } from './PaymentSourceSelector'
export type { PaymentSource, PaymentSourceData } from './PaymentSourceSelector'

export { PaymentConfirmationModal } from './PaymentConfirmationModal'

export { PaymentProcessor } from './PaymentProcessor'
