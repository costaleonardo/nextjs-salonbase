'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmailFromComponent } from '@/lib/email'
import ReceiptEmail, { ReceiptEmailData } from '@/lib/email-templates/receipt'
import { PaymentMethod } from '@prisma/client'

/**
 * Format payment method for display in receipt
 */
function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'CREDIT_CARD':
      return 'Credit Card'
    case 'GIFT_CERTIFICATE':
      return 'Gift Certificate'
    case 'CASH':
      return 'Cash'
    case 'OTHER':
      return 'Other'
    default:
      return method
  }
}

/**
 * Format date for receipt display
 */
function formatReceiptDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format time for receipt display
 */
function formatReceiptTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Generate receipt number from payment ID
 * Format: RCPT-YYYYMMDD-XXXXX (last 5 chars of payment ID)
 */
function generateReceiptNumber(paymentId: string, createdAt: Date): string {
  const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
  const shortId = paymentId.slice(-5).toUpperCase()
  return `RCPT-${dateStr}-${shortId}`
}

/**
 * Prepare receipt data from payment record
 */
async function prepareReceiptData(paymentId: string): Promise<{
  success: boolean
  data?: ReceiptEmailData
  error?: string
}> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
            staff: true,
            salon: true,
          },
        },
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    const { appointment } = payment
    const metadata = payment.metadata as {
      giftCertificateApplied?: number
    } | null

    const receiptData: ReceiptEmailData = {
      salonName: appointment.salon.name,
      salonEmail: appointment.salon.email || undefined,
      salonPhone: appointment.salon.phone || undefined,
      salonAddress: appointment.salon.address || undefined,
      clientName: appointment.client.name,
      clientEmail: appointment.client.email || undefined,
      appointmentDate: formatReceiptDate(appointment.datetime),
      appointmentTime: formatReceiptTime(appointment.datetime),
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
      amount: Number(payment.amount),
      paymentMethod: formatPaymentMethod(payment.method),
      paymentDate: formatReceiptDate(payment.createdAt),
      receiptNumber: generateReceiptNumber(payment.id, payment.createdAt),
      transactionId: payment.stripePaymentId || undefined,
      giftCertificateApplied: metadata?.giftCertificateApplied
        ? Number(metadata.giftCertificateApplied)
        : undefined,
    }

    return { success: true, data: receiptData }
  } catch (error) {
    console.error('Error preparing receipt data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare receipt data',
    }
  }
}

/**
 * Send receipt email to client
 */
export async function sendReceipt(paymentId: string, recipientEmail?: string) {
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
          salonId: session.user.salonId,
        },
      },
      include: {
        appointment: {
          include: {
            client: true,
          },
        },
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    if (payment.status !== 'COMPLETED') {
      return { success: false, error: 'Can only send receipts for completed payments' }
    }

    // Determine recipient email
    const toEmail = recipientEmail || payment.appointment.client.email

    if (!toEmail) {
      return {
        success: false,
        error: 'Client email not found. Please provide a recipient email.',
      }
    }

    // Prepare receipt data
    const receiptDataResult = await prepareReceiptData(paymentId)
    if (!receiptDataResult.success || !receiptDataResult.data) {
      return {
        success: false,
        error: receiptDataResult.error || 'Failed to prepare receipt',
      }
    }

    // Send email
    const emailResult = await sendEmailFromComponent({
      to: toEmail,
      subject: `Payment Receipt - ${receiptDataResult.data.salonName}`,
      component: ReceiptEmail(receiptDataResult.data),
    })

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || 'Failed to send receipt email',
      }
    }

    // Update payment metadata with receipt sent information
    const currentMetadata = (payment.metadata as Record<string, any>) || {}
    const emailId = emailResult.data && 'id' in emailResult.data ? emailResult.data.id : undefined
    await db.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...currentMetadata,
          receiptSent: true,
          receiptSentAt: new Date().toISOString(),
          receiptSentTo: toEmail,
          receiptEmailId: emailId,
        },
      },
    })

    return {
      success: true,
      data: {
        receiptNumber: receiptDataResult.data.receiptNumber,
        sentTo: toEmail,
        emailId,
      },
    }
  } catch (error) {
    console.error('Error sending receipt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send receipt',
    }
  }
}

/**
 * Resend receipt email
 * Allows staff to resend a receipt to the same or different email
 */
export async function resendReceipt(paymentId: string, recipientEmail?: string) {
  return sendReceipt(paymentId, recipientEmail)
}

/**
 * Get receipt data (for preview or display)
 */
export async function getReceiptData(paymentId: string) {
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
          salonId: session.user.salonId,
        },
      },
    })

    if (!payment) {
      return { success: false, error: 'Payment not found' }
    }

    return await prepareReceiptData(paymentId)
  } catch (error) {
    console.error('Error getting receipt data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get receipt data',
    }
  }
}
