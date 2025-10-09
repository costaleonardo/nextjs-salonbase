'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Prisma, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

// ============================================
// Types
// ============================================

export type StaffInput = {
  name: string
  email: string
  password: string
  role: 'OWNER' | 'STAFF'
}

export type StaffUpdateInput = {
  name?: string
  email?: string
  password?: string
  role?: 'OWNER' | 'STAFF'
  isActive?: boolean
}

export type StaffFilters = {
  salonId?: string
  role?: Role
  isActive?: boolean
  search?: string
}

export type BlockedTimeInput = {
  staffId: string
  startTime: Date
  endTime: Date
  reason?: string
  recurring?: boolean
}

// ============================================
// Get Staff Members
// ============================================

export async function getStaff(filters?: StaffFilters) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const salonId = filters?.salonId || session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    const where: Prisma.UserWhereInput = {
      salonId,
      role: { in: ['OWNER', 'STAFF'] },
    }

    // Filter by role
    if (filters?.role) {
      where.role = filters.role
    }

    // Search by name or email
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const staff = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            staffAppointments: true,
            blockedTimes: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNERs first
        { name: 'asc' },
      ],
    })

    return { success: true, data: staff }
  } catch (error) {
    console.error('Error fetching staff:', error)
    return { success: false, error: 'Failed to fetch staff members' }
  }
}

// ============================================
// Get Staff Member by ID
// ============================================

export async function getStaffById(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    const staff = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        salonId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            staffAppointments: true,
            blockedTimes: true,
          },
        },
      },
    })

    if (!staff) {
      return { success: false, error: 'Staff member not found' }
    }

    // Verify staff belongs to user's salon
    if (staff.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized access to staff member' }
    }

    return { success: true, data: staff }
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return { success: false, error: 'Failed to fetch staff member' }
  }
}

// ============================================
// Create Staff Member
// ============================================

export async function createStaff(input: StaffInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can create staff
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can add staff members' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Validate input
    if (!input.name?.trim()) {
      return { success: false, error: 'Name is required' }
    }

    if (!input.email?.trim()) {
      return { success: false, error: 'Email is required' }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      return { success: false, error: 'Invalid email format' }
    }

    if (!input.password || input.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    })

    if (existingUser) {
      return { success: false, error: 'Email already in use' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10)

    // Create staff member
    const staff = await db.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        password: hashedPassword,
        role: input.role,
        salonId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return { success: true, data: staff }
  } catch (error) {
    console.error('Error creating staff member:', error)
    return { success: false, error: 'Failed to create staff member' }
  }
}

// ============================================
// Update Staff Member
// ============================================

export async function updateStaff(id: string, input: StaffUpdateInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can update staff
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can update staff members' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Verify staff member exists and belongs to user's salon
    const existingStaff = await db.user.findUnique({
      where: { id },
    })

    if (!existingStaff) {
      return { success: false, error: 'Staff member not found' }
    }

    if (existingStaff.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to staff member' }
    }

    // Prevent owner from demoting themselves
    if (id === session.user.id && input.role === 'STAFF') {
      return { success: false, error: 'You cannot change your own role' }
    }

    // Validate input
    if (input.name !== undefined && !input.name.trim()) {
      return { success: false, error: 'Name cannot be empty' }
    }

    if (input.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.email)) {
        return { success: false, error: 'Invalid email format' }
      }

      // Check if email is already in use by another user
      const existingEmail = await db.user.findUnique({
        where: { email: input.email.toLowerCase().trim() },
      })

      if (existingEmail && existingEmail.id !== id) {
        return { success: false, error: 'Email already in use' }
      }
    }

    if (input.password !== undefined && input.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {}
    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.email !== undefined) updateData.email = input.email.toLowerCase().trim()
    if (input.role !== undefined) updateData.role = input.role
    if (input.password !== undefined) {
      updateData.password = await bcrypt.hash(input.password, 10)
    }

    const staff = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    })

    return { success: true, data: staff }
  } catch (error) {
    console.error('Error updating staff member:', error)
    return { success: false, error: 'Failed to update staff member' }
  }
}

// ============================================
// Delete Staff Member (OWNER only)
// ============================================

export async function deleteStaff(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER can delete staff
    if (session.user.role !== 'OWNER') {
      return { success: false, error: 'Only salon owners can delete staff members' }
    }

    const salonId = session.user.salonId
    if (!salonId) {
      return { success: false, error: 'Salon ID is required' }
    }

    // Prevent owner from deleting themselves
    if (id === session.user.id) {
      return { success: false, error: 'You cannot delete your own account' }
    }

    // Verify staff member exists and belongs to user's salon
    const staff = await db.user.findUnique({
      where: { id },
      include: {
        staffAppointments: {
          where: {
            status: 'SCHEDULED',
          },
          take: 1,
        },
      },
    })

    if (!staff) {
      return { success: false, error: 'Staff member not found' }
    }

    if (staff.salonId !== salonId) {
      return { success: false, error: 'Unauthorized access to staff member' }
    }

    // Prevent deletion if there are scheduled appointments
    if (staff.staffAppointments.length > 0) {
      return {
        success: false,
        error: 'Cannot delete staff member with scheduled appointments. Reassign appointments first.',
      }
    }

    await db.user.delete({
      where: { id },
    })

    return { success: true, data: null }
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return { success: false, error: 'Failed to delete staff member' }
  }
}

// ============================================
// Blocked Times Management
// ============================================

export async function getBlockedTimes(staffId: string, startDate?: Date, endDate?: Date) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify staff member belongs to user's salon
    const staff = await db.user.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return { success: false, error: 'Staff member not found' }
    }

    if (staff.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized access to staff member' }
    }

    const where: Prisma.BlockedTimeWhereInput = {
      staffId,
    }

    // Filter by date range
    if (startDate || endDate) {
      where.AND = []
      if (startDate) {
        where.AND.push({ endTime: { gte: startDate } })
      }
      if (endDate) {
        where.AND.push({ startTime: { lte: endDate } })
      }
    }

    const blockedTimes = await db.blockedTime.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    })

    return { success: true, data: blockedTimes }
  } catch (error) {
    console.error('Error fetching blocked times:', error)
    return { success: false, error: 'Failed to fetch blocked times' }
  }
}

export async function createBlockedTime(input: BlockedTimeInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can create blocked times
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Staff can only create blocked times for themselves
    if (session.user.role === 'STAFF' && input.staffId !== session.user.id) {
      return { success: false, error: 'You can only manage your own schedule' }
    }

    // Verify staff member belongs to user's salon
    const staff = await db.user.findUnique({
      where: { id: input.staffId },
    })

    if (!staff) {
      return { success: false, error: 'Staff member not found' }
    }

    if (staff.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized access to staff member' }
    }

    // Validate time range
    if (input.startTime >= input.endTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    // Check for overlapping blocked times
    const overlapping = await db.blockedTime.findFirst({
      where: {
        staffId: input.staffId,
        OR: [
          {
            AND: [
              { startTime: { lte: input.startTime } },
              { endTime: { gt: input.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: input.endTime } },
              { endTime: { gte: input.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: input.startTime } },
              { endTime: { lte: input.endTime } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return { success: false, error: 'This time range overlaps with an existing blocked time' }
    }

    const blockedTime = await db.blockedTime.create({
      data: {
        staffId: input.staffId,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason || null,
        recurring: input.recurring || false,
      },
    })

    return { success: true, data: blockedTime }
  } catch (error) {
    console.error('Error creating blocked time:', error)
    return { success: false, error: 'Failed to create blocked time' }
  }
}

export async function deleteBlockedTime(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only OWNER and STAFF can delete blocked times
    if (session.user.role === 'CLIENT') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const blockedTime = await db.blockedTime.findUnique({
      where: { id },
      include: {
        staff: true,
      },
    })

    if (!blockedTime) {
      return { success: false, error: 'Blocked time not found' }
    }

    // Staff can only delete their own blocked times
    if (session.user.role === 'STAFF' && blockedTime.staffId !== session.user.id) {
      return { success: false, error: 'You can only manage your own schedule' }
    }

    // Verify staff belongs to user's salon
    if (blockedTime.staff.salonId !== session.user.salonId) {
      return { success: false, error: 'Unauthorized access' }
    }

    await db.blockedTime.delete({
      where: { id },
    })

    return { success: true, data: null }
  } catch (error) {
    console.error('Error deleting blocked time:', error)
    return { success: false, error: 'Failed to delete blocked time' }
  }
}
