'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ============================================
// Types
// ============================================

export type ClientWithStats = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  emailNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
  createdAt: Date
  updatedAt: Date
  totalSpend: number
  visitCount: number
  lastVisit: Date | null
  upcomingAppointments: number
}

export type ClientFilters = {
  search?: string
  salonId: string
}

// ============================================
// Get Clients with Stats
// ============================================

export async function getClients(filters?: ClientFilters) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Staff can only see clients from their salon
    const salonId = filters?.salonId || session.user.salonId

    if (salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    const whereClause: Prisma.ClientWhereInput = {
      salonId,
    }

    // Search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }

    // Get clients with appointments for stats
    const clients = await db.client.findMany({
      where: whereClause,
      include: {
        appointments: {
          include: {
            service: true,
            payment: true,
          },
          orderBy: {
            datetime: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate stats for each client
    const clientsWithStats: ClientWithStats[] = clients.map((client) => {
      const completedAppointments = client.appointments.filter(
        (apt) => apt.status === 'COMPLETED'
      )

      const totalSpend = completedAppointments.reduce((sum, apt) => {
        if (apt.payment?.status === 'COMPLETED') {
          return sum + Number(apt.payment.amount)
        }
        return sum
      }, 0)

      const visitCount = completedAppointments.length

      const lastVisit =
        completedAppointments.length > 0
          ? completedAppointments[0].datetime
          : null

      const upcomingAppointments = client.appointments.filter(
        (apt) => apt.status === 'SCHEDULED' && apt.datetime > new Date()
      ).length

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        emailNotificationsEnabled: client.emailNotificationsEnabled,
        smsNotificationsEnabled: client.smsNotificationsEnabled,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        totalSpend,
        visitCount,
        lastVisit,
        upcomingAppointments,
      }
    })

    return { success: true, data: clientsWithStats }
  } catch (error) {
    console.error('Error fetching clients:', error)
    return { success: false, error: 'Failed to fetch clients' }
  }
}

// ============================================
// Get Single Client with Details
// ============================================

export async function getClientById(clientId: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      include: {
        appointments: {
          include: {
            service: true,
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            payment: true,
          },
          orderBy: {
            datetime: 'desc',
          },
        },
        giftCertificates: {
          where: {
            balance: {
              gt: 0,
            },
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        memberships: {
          include: {
            tier: true,
          },
          where: {
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!client) {
      return { success: false, error: 'Client not found' }
    }

    // Verify salon access
    if (client.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Calculate stats
    const completedAppointments = client.appointments.filter(
      (apt) => apt.status === 'COMPLETED'
    )

    const totalSpend = completedAppointments.reduce((sum, apt) => {
      if (apt.payment?.status === 'COMPLETED') {
        return sum + Number(apt.payment.amount)
      }
      return sum
    }, 0)

    const visitCount = completedAppointments.length

    const lastVisit =
      completedAppointments.length > 0
        ? completedAppointments[0].datetime
        : null

    const upcomingAppointments = client.appointments.filter(
      (apt) => apt.status === 'SCHEDULED' && apt.datetime > new Date()
    )

    return {
      success: true,
      data: {
        ...client,
        stats: {
          totalSpend,
          visitCount,
          lastVisit,
          upcomingAppointments: upcomingAppointments.length,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching client:', error)
    return { success: false, error: 'Failed to fetch client details' }
  }
}

// ============================================
// Create Client
// ============================================

export async function createClient(data: {
  name: string
  email?: string
  phone?: string
  notes?: string
  emailNotificationsEnabled?: boolean
  smsNotificationsEnabled?: boolean
}) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate required fields
    if (!data.name?.trim()) {
      return { success: false, error: 'Client name is required' }
    }

    // Validate email format if provided
    if (data.email && !isValidEmail(data.email)) {
      return { success: false, error: 'Invalid email address' }
    }

    // Validate phone format if provided
    if (data.phone && !isValidPhone(data.phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    // Check for duplicate email in the same salon
    if (data.email) {
      const existingClientByEmail = await db.client.findFirst({
        where: {
          salonId: session.user.salonId,
          email: data.email,
        },
      })

      if (existingClientByEmail) {
        return {
          success: false,
          error: 'A client with this email already exists',
        }
      }
    }

    // Check for duplicate phone in the same salon
    if (data.phone) {
      const existingClientByPhone = await db.client.findFirst({
        where: {
          salonId: session.user.salonId,
          phone: data.phone,
        },
      })

      if (existingClientByPhone) {
        return {
          success: false,
          error: 'A client with this phone number already exists',
        }
      }
    }

    const client = await db.client.create({
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
        emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
        smsNotificationsEnabled: data.smsNotificationsEnabled ?? true,
        salonId: session.user.salonId,
      },
    })

    return { success: true, data: client }
  } catch (error) {
    console.error('Error creating client:', error)
    return { success: false, error: 'Failed to create client' }
  }
}

// ============================================
// Update Client
// ============================================

export async function updateClient(
  clientId: string,
  data: {
    name?: string
    email?: string
    phone?: string
    notes?: string
    emailNotificationsEnabled?: boolean
    smsNotificationsEnabled?: boolean
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify client exists and belongs to user's salon
    const existingClient = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!existingClient) {
      return { success: false, error: 'Client not found' }
    }

    if (existingClient.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate email format if provided
    if (data.email !== undefined && data.email && !isValidEmail(data.email)) {
      return { success: false, error: 'Invalid email address' }
    }

    // Validate phone format if provided
    if (data.phone !== undefined && data.phone && !isValidPhone(data.phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    // Check for duplicate email (excluding current client)
    if (data.email !== undefined && data.email) {
      const duplicateEmail = await db.client.findFirst({
        where: {
          salonId: session.user.salonId,
          email: data.email,
          id: { not: clientId },
        },
      })

      if (duplicateEmail) {
        return {
          success: false,
          error: 'Another client with this email already exists',
        }
      }
    }

    // Check for duplicate phone (excluding current client)
    if (data.phone !== undefined && data.phone) {
      const duplicatePhone = await db.client.findFirst({
        where: {
          salonId: session.user.salonId,
          phone: data.phone,
          id: { not: clientId },
        },
      })

      if (duplicatePhone) {
        return {
          success: false,
          error: 'Another client with this phone number already exists',
        }
      }
    }

    const updateData: Prisma.ClientUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.email !== undefined)
      updateData.email = data.email?.trim() || null
    if (data.phone !== undefined)
      updateData.phone = data.phone?.trim() || null
    if (data.notes !== undefined)
      updateData.notes = data.notes?.trim() || null
    if (data.emailNotificationsEnabled !== undefined)
      updateData.emailNotificationsEnabled = data.emailNotificationsEnabled
    if (data.smsNotificationsEnabled !== undefined)
      updateData.smsNotificationsEnabled = data.smsNotificationsEnabled

    const client = await db.client.update({
      where: { id: clientId },
      data: updateData,
    })

    return { success: true, data: client }
  } catch (error) {
    console.error('Error updating client:', error)
    return { success: false, error: 'Failed to update client' }
  }
}

// ============================================
// Delete Client
// ============================================

export async function deleteClient(clientId: string) {
  try {
    const session = await auth()
    if (!session?.user?.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can delete clients
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can delete clients' }
    }

    // Verify client exists and belongs to user's salon
    const existingClient = await db.client.findUnique({
      where: { id: clientId },
      include: {
        appointments: {
          where: {
            status: 'SCHEDULED',
            datetime: {
              gt: new Date(),
            },
          },
        },
      },
    })

    if (!existingClient) {
      return { success: false, error: 'Client not found' }
    }

    if (existingClient.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check for upcoming appointments
    if (existingClient.appointments.length > 0) {
      return {
        success: false,
        error:
          'Cannot delete client with upcoming appointments. Please cancel appointments first.',
      }
    }

    await db.client.delete({
      where: { id: clientId },
    })

    return { success: true, data: { id: clientId } }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: 'Failed to delete client' }
  }
}

// ============================================
// Helper Functions
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10
}
