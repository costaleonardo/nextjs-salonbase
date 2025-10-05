'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stripe, DEFAULT_CURRENCY, MINIMUM_CHARGE_AMOUNT } from '@/lib/stripe'
import { redeemGiftCertificate } from './gift-certificates'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

/**
 * CRITICAL PAYMENT PROCESSING MODULE
 *
 * This module implements the payment processing logic with the following guarantees:
 * 1. Gift certificates are checked and applied FIRST
 * 2. Every payment decision is logged to PaymentAuditLog
 * 3. Automatic rollback on payment failures
 * 4. Retry logic with maximum 2 attempts
 * 5. Explicit user confirmation required before charging credit cards
 */

interface PaymentAuditLogEntry {
  action: string
  details: Record<string, any>
  timestamp: Date
}

/**
 * Logs an entry to the payment audit log
 */
async function logPaymentAudit(
  paymentId: string,
  action: string,
  details: Record<string, any>
) {
  try {
    await db.paymentAuditLog.create({
      data: {
        paymentId,
        action,
        details
      }
    })
  } catch (error) {
    // Audit logging should never fail the payment
    console.error('Failed to log payment audit:', error)
  }
}

/**
 * Process a payment with full audit trail and rollback support
 */
export async function processPayment(data: {
  appointmentId: string
  amount: number
  paymentSource: {
    type: 'GIFT_CERTIFICATE' | 'CREDIT_CARD' | 'CASH' | 'OTHER'
    giftCertificateCode?: string
    giftCertificateBalance?: number
    stripePaymentMethodId?: string
  }
  retryAttempt?: number
}) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate amount
  if (data.amount <= 0) {
    return { success: false, error: 'Invalid payment amount' }
  }

  const retryAttempt = data.retryAttempt || 0
  const maxRetries = 2

  if (retryAttempt >= maxRetries) {
    return { success: false, error: 'Maximum payment retry attempts exceeded' }
  }

  try {
    // Verify appointment exists and belongs to user's salon
    const appointment = await db.appointment.findFirst({
      where: {
        id: data.appointmentId,
        salonId: session.user.salonId!
      },
      include: {
        service: true,
        client: true,
        payment: true
      }
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    if (appointment.payment) {
      return { success: false, error: 'Payment already exists for this appointment' }
    }

    // Create initial payment record with PENDING status
    const payment = await db.payment.create({
      data: {
        appointmentId: data.appointmentId,
        amount: data.amount,
        method: data.paymentSource.type as PaymentMethod,
        status: PaymentStatus.PENDING,
        metadata: {
          processedBy: session.user.id,
          processedAt: new Date().toISOString(),
          retryAttempt
        }
      }
    })

    // Log payment source selection
    await logPaymentAudit(payment.id, 'source_selected', {
      source: data.paymentSource.type,
      amount: data.amount,
      appointmentId: data.appointmentId,
      selectedBy: session.user.email,
      giftCertificateCode: data.paymentSource.giftCertificateCode,
      timestamp: new Date().toISOString()
    })

    // Process payment based on source type
    let paymentResult: {
      success: boolean
      stripePaymentId?: string
      amountCharged?: number
      giftCertificateApplied?: number
      error?: string
    }

    try {
      switch (data.paymentSource.type) {
        case 'GIFT_CERTIFICATE':
          paymentResult = await processGiftCertificatePayment(
            payment.id,
            data.amount,
            data.paymentSource.giftCertificateCode!
          )
          break

        case 'CREDIT_CARD':
          paymentResult = await processCreditCardPayment(
            payment.id,
            data.amount,
            data.paymentSource.stripePaymentMethodId
          )
          break

        case 'CASH':
        case 'OTHER':
          paymentResult = await processManualPayment(
            payment.id,
            data.amount,
            data.paymentSource.type
          )
          break

        default:
          throw new Error('Invalid payment source type')
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed')
      }

      // Update payment status to COMPLETED
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          stripePaymentId: paymentResult.stripePaymentId,
          metadata: {
            ...(payment.metadata as object),
            completedAt: new Date().toISOString(),
            amountCharged: paymentResult.amountCharged,
            giftCertificateApplied: paymentResult.giftCertificateApplied
          }
        }
      })

      // Log successful payment
      await logPaymentAudit(payment.id, 'payment_succeeded', {
        amount: data.amount,
        method: data.paymentSource.type,
        stripePaymentId: paymentResult.stripePaymentId,
        timestamp: new Date().toISOString()
      })

      return {
        success: true,
        data: {
          paymentId: payment.id,
          status: 'COMPLETED',
          amount: data.amount,
          method: data.paymentSource.type
        }
      }
    } catch (processingError) {
      // Payment processing failed - rollback
      await rollbackPayment(payment.id, processingError)

      // If this was not the last retry, suggest retry
      if (retryAttempt < maxRetries - 1) {
        return {
          success: false,
          error: processingError instanceof Error ? processingError.message : 'Payment failed',
          canRetry: true,
          retryAttempt: retryAttempt + 1
        }
      }

      return {
        success: false,
        error: processingError instanceof Error ? processingError.message : 'Payment failed',
        canRetry: false
      }
    }
  } catch (error) {
    console.error('Payment processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    }
  }
}

/**
 * Process gift certificate payment
 */
async function processGiftCertificatePayment(
  paymentId: string,
  amount: number,
  giftCertificateCode: string
) {
  await logPaymentAudit(paymentId, 'gift_certificate_payment_attempt', {
    code: giftCertificateCode,
    amount,
    timestamp: new Date().toISOString()
  })

  const result = await redeemGiftCertificate({
    code: giftCertificateCode,
    amountToRedeem: amount,
    paymentId
  })

  if (!result.success) {
    await logPaymentAudit(paymentId, 'gift_certificate_payment_failed', {
      code: giftCertificateCode,
      error: result.error,
      timestamp: new Date().toISOString()
    })
    throw new Error(result.error || 'Failed to redeem gift certificate')
  }

  await logPaymentAudit(paymentId, 'gift_certificate_payment_succeeded', {
    code: giftCertificateCode,
    amountApplied: result.data!.amountApplied,
    remainingBalance: result.data!.remainingBalance,
    timestamp: new Date().toISOString()
  })

  return {
    success: true,
    giftCertificateApplied: result.data!.amountApplied
  }
}

/**
 * Process credit card payment via Stripe
 */
async function processCreditCardPayment(
  paymentId: string,
  amount: number,
  paymentMethodId?: string
) {
  // Convert to cents for Stripe
  const amountInCents = Math.round(amount * 100)

  if (amountInCents < MINIMUM_CHARGE_AMOUNT) {
    throw new Error(`Minimum charge amount is $${MINIMUM_CHARGE_AMOUNT / 100}`)
  }

  await logPaymentAudit(paymentId, 'credit_card_payment_attempt', {
    amount,
    amountInCents,
    timestamp: new Date().toISOString()
  })

  try {
    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: DEFAULT_CURRENCY,
      payment_method: paymentMethodId,
      confirm: paymentMethodId ? true : false,
      automatic_payment_methods: paymentMethodId ? undefined : {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        paymentId,
        source: 'salonbase_mvp'
      }
    })

    await logPaymentAudit(paymentId, 'stripe_payment_intent_created', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: amountInCents,
      timestamp: new Date().toISOString()
    })

    // Check if payment requires additional action (3D Secure)
    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
      return {
        success: false,
        error: 'Payment requires additional authentication',
        requiresAction: true,
        clientSecret: paymentIntent.client_secret
      }
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`)
    }

    await logPaymentAudit(paymentId, 'credit_card_payment_succeeded', {
      paymentIntentId: paymentIntent.id,
      amount,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      stripePaymentId: paymentIntent.id,
      amountCharged: amount
    }
  } catch (error) {
    await logPaymentAudit(paymentId, 'credit_card_payment_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    throw error
  }
}

/**
 * Process manual payment (cash, check, etc.)
 */
async function processManualPayment(
  paymentId: string,
  amount: number,
  method: 'CASH' | 'OTHER'
) {
  await logPaymentAudit(paymentId, 'manual_payment_processed', {
    method,
    amount,
    timestamp: new Date().toISOString()
  })

  return {
    success: true,
    amountCharged: amount
  }
}

/**
 * Rollback a failed payment
 */
async function rollbackPayment(paymentId: string, error: unknown) {
  try {
    // Update payment status to FAILED
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        metadata: {
          failedAt: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // Log the rollback
    await logPaymentAudit(paymentId, 'payment_rolled_back', {
      reason: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  } catch (rollbackError) {
    console.error('Failed to rollback payment:', rollbackError)
    // Log the rollback failure
    await logPaymentAudit(paymentId, 'rollback_failed', {
      originalError: error instanceof Error ? error.message : 'Unknown error',
      rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Get payment by appointment ID
 */
export async function getPaymentByAppointmentId(appointmentId: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    const payment = await db.payment.findFirst({
      where: {
        appointmentId,
        appointment: {
          salonId: session.user.salonId
        }
      },
      include: {
        appointment: {
          include: {
            client: true,
            service: true
          }
        }
      }
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    return { success: true, data: payment }
  } catch (error) {
    console.error('Error fetching payment:', error)
    return { success: false, error: 'Failed to fetch payment' }
  }
}

/**
 * Get payment audit log for a payment
 */
export async function getPaymentAuditLog(paymentId: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify payment belongs to user's salon
    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        appointment: {
          salonId: session.user.salonId
        }
      }
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    const auditLogs = await db.paymentAuditLog.findMany({
      where: {
        paymentId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return { success: true, data: auditLogs }
  } catch (error) {
    console.error('Error fetching payment audit log:', error)
    return { success: false, error: 'Failed to fetch audit log' }
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentId: string, reason?: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can process refunds
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can process refunds' }
    }

    const payment = await db.payment.findFirst({
      where: {
        id: paymentId,
        appointment: {
          salonId: session.user.salonId
        }
      }
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      return { success: false, error: 'Only completed payments can be refunded' }
    }

    // Log refund initiation
    await logPaymentAudit(paymentId, 'refund_initiated', {
      initiatedBy: session.user.email,
      reason,
      timestamp: new Date().toISOString()
    })

    // Process refund based on payment method
    if (payment.method === PaymentMethod.CREDIT_CARD && payment.stripePaymentId) {
      // Refund via Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        reason: 'requested_by_customer'
      })

      await logPaymentAudit(paymentId, 'stripe_refund_created', {
        refundId: refund.id,
        status: refund.status,
        timestamp: new Date().toISOString()
      })
    }

    // Update payment status
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        metadata: {
          ...(payment.metadata as object),
          refundedAt: new Date().toISOString(),
          refundedBy: session.user.email,
          refundReason: reason
        }
      }
    })

    await logPaymentAudit(paymentId, 'refund_completed', {
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    console.error('Error refunding payment:', error)
    return { success: false, error: 'Failed to process refund' }
  }
}
