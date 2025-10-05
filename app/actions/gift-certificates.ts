'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Generates a unique gift certificate code
 * Format: XXXX-XXXX-XXXX (alphanumeric, no ambiguous characters)
 */
function generateGiftCertificateCode(): string {
  // Use only unambiguous characters (remove 0, O, I, 1, etc.)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segments = 3
  const segmentLength = 4

  const code = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () => {
      return chars[Math.floor(Math.random() * chars.length)]
    }).join('')
  }).join('-')

  return code
}

/**
 * Creates a new gift certificate
 */
export async function createGiftCertificate(data: {
  salonId: string
  amount: number
  clientId?: string
  expiresAt?: Date
}) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify user has permission (OWNER or STAFF of the salon)
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    if (session.user.salonId !== data.salonId) {
      return { success: false, error: 'Unauthorized: Cannot create certificate for another salon' }
    }

    // Validate amount
    if (data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' }
    }

    // Generate unique code with retry logic (max 10 attempts)
    let code: string
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      code = generateGiftCertificateCode()

      // Check if code already exists
      const existing = await db.giftCertificate.findUnique({
        where: { code }
      })

      if (!existing) {
        // Code is unique, create the certificate
        const certificate = await db.giftCertificate.create({
          data: {
            code,
            salonId: data.salonId,
            clientId: data.clientId,
            balance: data.amount,
            originalAmount: data.amount,
            expiresAt: data.expiresAt
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        return { success: true, data: certificate }
      }

      attempts++
    }

    // If we got here, we couldn't generate a unique code
    return { success: false, error: 'Failed to generate unique certificate code. Please try again.' }
  } catch (error) {
    console.error('Error creating gift certificate:', error)
    return { success: false, error: 'Failed to create gift certificate' }
  }
}

/**
 * Checks the balance of a gift certificate
 */
export async function checkGiftCertificateBalance(code: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Normalize code (uppercase, remove spaces)
    const normalizedCode = code.toUpperCase().replace(/\s/g, '')

    const certificate = await db.giftCertificate.findFirst({
      where: {
        code: normalizedCode,
        salonId: session.user.salonId
      },
      select: {
        id: true,
        code: true,
        balance: true,
        originalAmount: true,
        expiresAt: true,
        createdAt: true,
        client: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!certificate) {
      return { success: false, error: 'Gift certificate not found' }
    }

    // Check if expired
    const now = new Date()
    const isExpired = certificate.expiresAt && certificate.expiresAt < now

    if (isExpired) {
      return {
        success: false,
        error: 'Gift certificate has expired',
        data: certificate
      }
    }

    // Check if balance is zero
    if (certificate.balance <= 0) {
      return {
        success: false,
        error: 'Gift certificate has no remaining balance',
        data: certificate
      }
    }

    return { success: true, data: certificate }
  } catch (error) {
    console.error('Error checking gift certificate balance:', error)
    return { success: false, error: 'Failed to check gift certificate balance' }
  }
}

/**
 * Redeems a gift certificate (applies it to a payment)
 * Returns the amount applied and the remaining balance
 */
export async function redeemGiftCertificate(data: {
  code: string
  amountToRedeem: number
  paymentId?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Normalize code
    const normalizedCode = data.code.toUpperCase().replace(/\s/g, '')

    // Validate amount
    if (data.amountToRedeem <= 0) {
      return { success: false, error: 'Redemption amount must be greater than 0' }
    }

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Get certificate with lock (for update)
      const certificate = await tx.giftCertificate.findFirst({
        where: {
          code: normalizedCode,
          salonId: session.user.salonId
        }
      })

      if (!certificate) {
        throw new Error('Gift certificate not found')
      }

      // Validate certificate
      const now = new Date()
      if (certificate.expiresAt && certificate.expiresAt < now) {
        throw new Error('Gift certificate has expired')
      }

      if (certificate.balance <= 0) {
        throw new Error('Gift certificate has no remaining balance')
      }

      // Calculate amount to apply (cannot exceed balance)
      const amountApplied = Math.min(
        data.amountToRedeem,
        parseFloat(certificate.balance.toString())
      )

      // Update certificate balance
      const updatedCertificate = await tx.giftCertificate.update({
        where: { id: certificate.id },
        data: {
          balance: {
            decrement: amountApplied
          }
        }
      })

      return {
        certificateId: certificate.id,
        code: certificate.code,
        amountApplied,
        remainingBalance: parseFloat(updatedCertificate.balance.toString()),
        originalBalance: parseFloat(certificate.balance.toString())
      }
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error redeeming gift certificate:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to redeem gift certificate'
    return { success: false, error: errorMessage }
  }
}

/**
 * Gets all gift certificates for a salon
 */
export async function getGiftCertificates(filters?: {
  clientId?: string
  hasBalance?: boolean
  includeExpired?: boolean
}) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Build where clause
    const where: Prisma.GiftCertificateWhereInput = {
      salonId: session.user.salonId
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.hasBalance) {
      where.balance = { gt: 0 }
    }

    if (!filters?.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    }

    const certificates = await db.giftCertificate.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return { success: true, data: certificates }
  } catch (error) {
    console.error('Error getting gift certificates:', error)
    return { success: false, error: 'Failed to get gift certificates' }
  }
}

/**
 * Gets a single gift certificate by ID
 */
export async function getGiftCertificateById(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    const certificate = await db.giftCertificate.findFirst({
      where: {
        id,
        salonId: session.user.salonId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!certificate) {
      return { success: false, error: 'Gift certificate not found' }
    }

    return { success: true, data: certificate }
  } catch (error) {
    console.error('Error getting gift certificate:', error)
    return { success: false, error: 'Failed to get gift certificate' }
  }
}

/**
 * Voids a gift certificate (sets balance to 0)
 * This is irreversible and should only be used for customer service issues
 */
export async function voidGiftCertificate(id: string, reason?: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can void certificates
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can void gift certificates' }
    }

    const certificate = await db.giftCertificate.findFirst({
      where: {
        id,
        salonId: session.user.salonId
      }
    })

    if (!certificate) {
      return { success: false, error: 'Gift certificate not found' }
    }

    const updated = await db.giftCertificate.update({
      where: { id },
      data: {
        balance: 0
      }
    })

    // TODO: Log this action in an audit trail when implemented
    console.log(`Gift certificate ${certificate.code} voided by ${session.user.email}. Reason: ${reason || 'Not provided'}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error voiding gift certificate:', error)
    return { success: false, error: 'Failed to void gift certificate' }
  }
}
