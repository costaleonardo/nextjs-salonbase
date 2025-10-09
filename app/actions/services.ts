'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// ============================================
// Types
// ============================================

export type ServiceInput = {
  name: string
  description?: string
  duration: number // in minutes
  price: number
  staffIds?: string[]
}

export type ServiceUpdateInput = Partial<ServiceInput> & {
  isActive?: boolean
}

export type ServiceFilters = {
  salonId?: string
  isActive?: boolean
  search?: string
}

// ============================================
// Get Services
// ============================================

export async function getServices(filters?: ServiceFilters) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const salonId = filters?.salonId || session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    const where: Prisma.ServiceWhereInput = {
      salonId,
    }

    // Filter by active status
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    // Search by name or description
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const services = await db.service.findMany({
      where,
      orderBy: [
        { isActive: 'desc' }, // Active services first
        { name: 'asc' },
      ],
    })

    return { success: true, data: services }
  } catch (error) {
    console.error('Error fetching services:', error)
    return { success: false, error: 'Failed to fetch services' }
  }
}

// ============================================
// Get Service by ID
// ============================================

export async function getServiceById(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const service = await db.service.findUnique({
      where: { id },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // Verify service belongs to user's salon
    if (service.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized access to service' }
    }

    return { success: true, data: service }
  } catch (error) {
    console.error('Error fetching service:', error)
    return { success: false, error: 'Failed to fetch service' }
  }
}

// ============================================
// Create Service
// ============================================

export async function createService(input: ServiceInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can create services
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Validate input
    if (!input.name?.trim()) {
      return { success: false, error: 'Service name is required' }
    }

    if (input.duration <= 0) {
      return { success: false, error: 'Duration must be greater than 0' }
    }

    if (input.price < 0) {
      return { success: false, error: 'Price cannot be negative' }
    }

    // Verify all staff members exist and belong to the salon
    if (input.staffIds && input.staffIds.length > 0) {
      const staff = await db.user.findMany({
        where: {
          id: { in: input.staffIds },
          salonId,
          role: { in: ['OWNER', 'STAFF'] },
        },
      })

      if (staff.length !== input.staffIds.length) {
        return { success: false, error: 'One or more staff members not found' }
      }
    }

    const service = await db.service.create({
      data: {
        salonId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        duration: input.duration,
        price: input.price,
        staffIds: input.staffIds || [],
        isActive: true,
      },
    })

    return { success: true, data: service }
  } catch (error) {
    console.error('Error creating service:', error)
    return { success: false, error: 'Failed to create service' }
  }
}

// ============================================
// Update Service
// ============================================

export async function updateService(id: string, input: ServiceUpdateInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can update services
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Verify service exists and belongs to user's salon
    const existingService = await db.service.findUnique({
      where: { id },
    })

    if (!existingService) {
      return { success: false, error: 'Service not found' }
    }

    if (existingService.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to service' }
    }

    // Validate input
    if (input.name !== undefined && !input.name.trim()) {
      return { success: false, error: 'Service name cannot be empty' }
    }

    if (input.duration !== undefined && input.duration <= 0) {
      return { success: false, error: 'Duration must be greater than 0' }
    }

    if (input.price !== undefined && input.price < 0) {
      return { success: false, error: 'Price cannot be negative' }
    }

    // Verify all staff members exist and belong to the salon
    if (input.staffIds && input.staffIds.length > 0) {
      const staff = await db.user.findMany({
        where: {
          id: { in: input.staffIds },
          salonId,
          role: { in: ['OWNER', 'STAFF'] },
        },
      })

      if (staff.length !== input.staffIds.length) {
        return { success: false, error: 'One or more staff members not found' }
      }
    }

    // Build update data
    const updateData: Prisma.ServiceUpdateInput = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.description !== undefined) updateData.description = input.description?.trim() || null
    if (input.duration !== undefined) updateData.duration = input.duration
    if (input.price !== undefined) updateData.price = input.price
    if (input.staffIds !== undefined) updateData.staffIds = input.staffIds
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    const service = await db.service.update({
      where: { id },
      data: updateData,
    })

    return { success: true, data: service }
  } catch (error) {
    console.error('Error updating service:', error)
    return { success: false, error: 'Failed to update service' }
  }
}

// ============================================
// Archive/Delete Service
// ============================================

export async function archiveService(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can archive services
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Verify service exists and belongs to user's salon
    const service = await db.service.findUnique({
      where: { id },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    if (service.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to service' }
    }

    // Soft delete by setting isActive to false
    const updatedService = await db.service.update({
      where: { id },
      data: { isActive: false },
    })

    return { success: true, data: updatedService }
  } catch (error) {
    console.error('Error archiving service:', error)
    return { success: false, error: 'Failed to archive service' }
  }
}

// ============================================
// Restore Archived Service
// ============================================

export async function restoreService(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can restore services
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Verify service exists and belongs to user's salon
    const service = await db.service.findUnique({
      where: { id },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    if (service.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to service' }
    }

    const updatedService = await db.service.update({
      where: { id },
      data: { isActive: true },
    })

    return { success: true, data: updatedService }
  } catch (error) {
    console.error('Error restoring service:', error)
    return { success: false, error: 'Failed to restore service' }
  }
}

// ============================================
// Delete Service (Hard Delete - OWNER only)
// ============================================

export async function deleteService(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can permanently delete services
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can permanently delete services' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Verify service exists and belongs to user's salon
    const service = await db.service.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            status: { in: ['SCHEDULED'] },
          },
          take: 1,
        },
      },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    if (service.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to service' }
    }

    // Prevent deletion if there are scheduled appointments
    if (service.appointments.length > 0) {
      return {
        success: false,
        error: 'Cannot delete service with scheduled appointments. Archive it instead.'
      }
    }

    await db.service.delete({
      where: { id },
    })

    return { success: true, data: null }
  } catch (error) {
    console.error('Error deleting service:', error)
    return { success: false, error: 'Failed to delete service' }
  }
}

// ============================================
// Get Staff Members (for assignment)
// ============================================

export async function getStaffMembers() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    const staff = await db.user.findMany({
      where: {
        salonId,
        role: { in: ['OWNER', 'STAFF'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return { success: true, data: staff }
  } catch (error) {
    console.error('Error fetching staff members:', error)
    return { success: false, error: 'Failed to fetch staff members' }
  }
}
