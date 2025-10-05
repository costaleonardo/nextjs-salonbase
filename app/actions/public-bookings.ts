'use server'

import { db } from "@/lib/db"
import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  scheduleAppointmentConfirmation,
  scheduleAppointmentReminder,
} from "@/lib/notifications"

// ============================================
// Types
// ============================================

export type PublicBookingInput = {
  salonId: string
  serviceId: string
  staffId: string
  datetime: Date | string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  notes?: string
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================
// Helper Functions
// ============================================

/**
 * Get salon by slug
 */
export async function getSalonBySlug(slug: string) {
  try {
    const salon = await db.salon.findUnique({
      where: { slug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        users: {
          where: {
            role: {
              in: ['OWNER', 'STAFF'],
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!salon) {
      return { success: false, error: 'Salon not found' } as const
    }

    return { success: true, data: salon } as const
  } catch (error) {
    console.error('Error fetching salon:', error)
    return { success: false, error: 'Failed to fetch salon information' } as const
  }
}

/**
 * Get available time slots for a given date and staff member
 */
export async function getAvailableTimeSlots(input: {
  salonId: string
  staffId: string
  serviceId: string
  date: Date | string
}): Promise<ActionResult<string[]>> {
  try {
    const { salonId, staffId, serviceId, date } = input

    // Get service to determine duration
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get existing appointments for the staff member on this date
    const existingAppointments = await db.appointment.findMany({
      where: {
        salonId,
        staffId,
        datetime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        service: true,
      },
      orderBy: {
        datetime: 'asc',
      },
    })

    // Get blocked times for the staff member
    const blockedTimes = await db.blockedTime.findMany({
      where: {
        staffId,
        startTime: {
          lte: endOfDay,
        },
        endTime: {
          gte: startOfDay,
        },
      },
    })

    // Generate time slots (9 AM to 6 PM, 30-minute intervals)
    const slots: string[] = []
    const workStart = new Date(targetDate)
    workStart.setHours(9, 0, 0, 0)
    const workEnd = new Date(targetDate)
    workEnd.setHours(18, 0, 0, 0)

    let currentSlot = new Date(workStart)

    while (currentSlot < workEnd) {
      const slotEnd = new Date(currentSlot.getTime() + service.duration * 60000)

      // Check if slot conflicts with existing appointments
      let hasConflict = false

      for (const appointment of existingAppointments) {
        const appointmentStart = new Date(appointment.datetime)
        const appointmentEnd = new Date(
          appointmentStart.getTime() + appointment.service.duration * 60000
        )

        if (
          (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (currentSlot <= appointmentStart && slotEnd >= appointmentEnd)
        ) {
          hasConflict = true
          break
        }
      }

      // Check if slot conflicts with blocked times
      if (!hasConflict) {
        for (const blockedTime of blockedTimes) {
          const blockedStart = new Date(blockedTime.startTime)
          const blockedEnd = new Date(blockedTime.endTime)

          if (
            (currentSlot >= blockedStart && currentSlot < blockedEnd) ||
            (slotEnd > blockedStart && slotEnd <= blockedEnd) ||
            (currentSlot <= blockedStart && slotEnd >= blockedEnd)
          ) {
            hasConflict = true
            break
          }
        }
      }

      // If no conflicts and slot is in the future, add it
      const now = new Date()
      if (!hasConflict && currentSlot > now) {
        slots.push(currentSlot.toISOString())
      }

      // Move to next slot (30-minute intervals)
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000)
    }

    return { success: true, data: slots }
  } catch (error) {
    console.error('Error getting available time slots:', error)
    return { success: false, error: 'Failed to get available time slots' }
  }
}

/**
 * Create a public booking (no authentication required)
 */
export async function createPublicBooking(
  input: PublicBookingInput
): Promise<ActionResult<{ appointmentId: string; clientId: string }>> {
  try {
    const {
      salonId,
      serviceId,
      staffId,
      datetime,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = input

    // Validate required fields
    if (!clientName || (!clientEmail && !clientPhone)) {
      return {
        success: false,
        error: 'Please provide your name and either email or phone number',
      }
    }

    // Validate service exists and belongs to salon
    const service = await db.service.findFirst({
      where: {
        id: serviceId,
        salonId,
        isActive: true,
      },
    })

    if (!service) {
      return { success: false, error: 'Service not found or unavailable' }
    }

    // Validate staff exists and belongs to salon
    const staff = await db.user.findFirst({
      where: {
        id: staffId,
        salonId,
        role: {
          in: ['OWNER', 'STAFF'],
        },
      },
    })

    if (!staff) {
      return { success: false, error: 'Staff member not found' }
    }

    // Check for conflicts
    const appointmentDate = new Date(datetime)
    const appointmentEnd = new Date(
      appointmentDate.getTime() + service.duration * 60000
    )

    // Check existing appointments
    const conflictingAppointment = await db.appointment.findFirst({
      where: {
        staffId,
        status: AppointmentStatus.SCHEDULED,
        datetime: {
          lt: appointmentEnd,
        },
      },
      include: {
        service: true,
      },
    })

    if (conflictingAppointment) {
      const existingEnd = new Date(
        conflictingAppointment.datetime.getTime() +
          conflictingAppointment.service.duration * 60000
      )
      if (existingEnd > appointmentDate) {
        return {
          success: false,
          error: 'This time slot is no longer available. Please select another time.',
        }
      }
    }

    // Check blocked times
    const blockedTime = await db.blockedTime.findFirst({
      where: {
        staffId,
        startTime: {
          lt: appointmentEnd,
        },
        endTime: {
          gt: appointmentDate,
        },
      },
    })

    if (blockedTime) {
      return {
        success: false,
        error: 'This time slot is blocked. Please select another time.',
      }
    }

    // Find or create client
    let client = null

    if (clientEmail) {
      client = await db.client.findFirst({
        where: {
          salonId,
          email: clientEmail,
        },
      })
    }

    if (!client && clientPhone) {
      client = await db.client.findFirst({
        where: {
          salonId,
          phone: clientPhone,
        },
      })
    }

    if (!client) {
      client = await db.client.create({
        data: {
          salonId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          notes: notes || '',
        },
      })
    } else {
      // Update client info if different
      client = await db.client.update({
        where: { id: client.id },
        data: {
          name: clientName,
          email: clientEmail || client.email,
          phone: clientPhone || client.phone,
        },
      })
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        salonId,
        clientId: client.id,
        staffId,
        serviceId,
        datetime: appointmentDate,
        status: AppointmentStatus.SCHEDULED,
        notes: notes || '',
      },
      include: {
        service: true,
        staff: true,
        client: true,
        salon: true,
      },
    })

    // Schedule notifications (non-blocking)
    scheduleAppointmentConfirmation(appointment.id).catch((error) => {
      console.error('Failed to schedule confirmation notification:', error)
    })

    scheduleAppointmentReminder(appointment.id, appointment.datetime).catch((error) => {
      console.error('Failed to schedule reminder notification:', error)
    })

    revalidatePath('/dashboard/appointments')

    return {
      success: true,
      data: {
        appointmentId: appointment.id,
        clientId: client.id,
      },
    }
  } catch (error) {
    console.error('Error creating public booking:', error)
    return { success: false, error: 'Failed to create booking. Please try again.' }
  }
}
