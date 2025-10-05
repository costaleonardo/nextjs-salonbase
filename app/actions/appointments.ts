'use server'

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AppointmentStatus, Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  scheduleAppointmentConfirmation,
  scheduleAppointmentReminder,
  sendAppointmentCancellation,
  sendAppointmentRescheduled,
  cancelPendingReminder,
} from "@/lib/notifications"

// ============================================
// Types
// ============================================

export type AppointmentInput = {
  clientId: string
  staffId: string
  serviceId: string
  datetime: Date | string
  notes?: string
}

export type AppointmentUpdateInput = {
  id: string
  clientId?: string
  staffId?: string
  serviceId?: string
  datetime?: Date | string
  status?: AppointmentStatus
  notes?: string
}

export type AppointmentFilterInput = {
  startDate?: Date | string
  endDate?: Date | string
  staffId?: string
  clientId?: string
  status?: AppointmentStatus
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================
// Validation & Conflict Detection
// ============================================

/**
 * Check if a time slot conflicts with existing appointments or blocked times
 * Returns conflict details if found, null otherwise
 */
async function checkConflicts(
  staffId: string,
  datetime: Date,
  serviceDuration: number,
  excludeAppointmentId?: string
): Promise<{ type: 'appointment' | 'blocked'; details: string } | null> {
  const appointmentStart = new Date(datetime)
  const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60000)

  // Check for overlapping appointments
  const existingAppointments = await db.appointment.findMany({
    where: {
      staffId,
      status: {
        in: [AppointmentStatus.SCHEDULED],
      },
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
    },
    include: {
      service: true,
      client: true,
    },
  })

  for (const appointment of existingAppointments) {
    const existingStart = new Date(appointment.datetime)
    const existingEnd = new Date(existingStart.getTime() + appointment.service.duration * 60000)

    // Check if time slots overlap
    if (
      (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
      (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
      (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
    ) {
      return {
        type: 'appointment',
        details: `Conflicts with existing appointment for ${appointment.client.name} at ${existingStart.toLocaleTimeString()}`,
      }
    }
  }

  // Check for blocked times
  const blockedTimes = await db.blockedTime.findMany({
    where: {
      staffId,
      OR: [
        {
          // Check if appointment starts during blocked time
          AND: [
            { startTime: { lte: appointmentStart } },
            { endTime: { gt: appointmentStart } },
          ],
        },
        {
          // Check if appointment ends during blocked time
          AND: [
            { startTime: { lt: appointmentEnd } },
            { endTime: { gte: appointmentEnd } },
          ],
        },
        {
          // Check if appointment completely encompasses blocked time
          AND: [
            { startTime: { gte: appointmentStart } },
            { endTime: { lte: appointmentEnd } },
          ],
        },
      ],
    },
  })

  if (blockedTimes.length > 0) {
    const blockedTime = blockedTimes[0]
    return {
      type: 'blocked',
      details: `Staff is unavailable: ${blockedTime.reason || 'Blocked time'}`,
    }
  }

  return null
}

/**
 * Validate appointment input data
 */
async function validateAppointmentInput(
  input: AppointmentInput,
  salonId: string
): Promise<{ valid: true } | { valid: false; error: string }> {
  const datetime = new Date(input.datetime)

  // Check if datetime is in the past
  if (datetime < new Date()) {
    return { valid: false, error: 'Appointment time cannot be in the past' }
  }

  // Verify client exists and belongs to salon
  const client = await db.client.findFirst({
    where: {
      id: input.clientId,
      salonId,
    },
  })

  if (!client) {
    return { valid: false, error: 'Client not found' }
  }

  // Verify staff exists and belongs to salon
  const staff = await db.user.findFirst({
    where: {
      id: input.staffId,
      salonId,
      role: { in: [Role.OWNER, Role.STAFF] },
    },
  })

  if (!staff) {
    return { valid: false, error: 'Staff member not found' }
  }

  // Verify service exists and belongs to salon
  const service = await db.service.findFirst({
    where: {
      id: input.serviceId,
      salonId,
      isActive: true,
    },
  })

  if (!service) {
    return { valid: false, error: 'Service not found or inactive' }
  }

  // Verify staff can perform this service (if staffIds are specified)
  if (service.staffIds.length > 0 && !service.staffIds.includes(input.staffId)) {
    return { valid: false, error: 'Staff member cannot perform this service' }
  }

  return { valid: true }
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new appointment
 */
export async function createAppointment(
  input: AppointmentInput
): Promise<ActionResult<{ id: string; conflict?: { type: string; details: string } }>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Check permissions (OWNER and STAFF can create appointments)
    if (session.user.role === Role.CLIENT) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 3. Validate salonId
    if (!session.user.salonId) {
      return { success: false, error: 'No salon associated with user' }
    }

    // 4. Validate input
    const validation = await validateAppointmentInput(input, session.user.salonId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 5. Get service to check duration for conflict detection
    const service = await db.service.findUnique({
      where: { id: input.serviceId },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // 6. Check for conflicts
    const conflict = await checkConflicts(
      input.staffId,
      new Date(input.datetime),
      service.duration
    )

    if (conflict) {
      return {
        success: false,
        error: conflict.details,
      }
    }

    // 7. Create appointment
    const appointment = await db.appointment.create({
      data: {
        salonId: session.user.salonId,
        clientId: input.clientId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        datetime: new Date(input.datetime),
        notes: input.notes,
        status: AppointmentStatus.SCHEDULED,
      },
    })

    // 8. Schedule notifications (non-blocking)
    try {
      await scheduleAppointmentConfirmation(appointment.id)
      await scheduleAppointmentReminder(appointment.id, appointment.datetime)
    } catch (error) {
      console.error('Failed to schedule notifications:', error)
      // Don't fail the appointment creation if notifications fail
    }

    // 9. Revalidate appointments page
    revalidatePath('/dashboard/appointments')

    return { success: true, data: { id: appointment.id } }
  } catch (error) {
    console.error('Error creating appointment:', error)
    return { success: false, error: 'Failed to create appointment' }
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  input: AppointmentUpdateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Check permissions
    if (session.user.role === Role.CLIENT) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 3. Validate salonId
    if (!session.user.salonId) {
      return { success: false, error: 'No salon associated with user' }
    }

    // 4. Verify appointment exists and belongs to salon
    const existingAppointment = await db.appointment.findFirst({
      where: {
        id: input.id,
        salonId: session.user.salonId,
      },
      include: {
        service: true,
      },
    })

    if (!existingAppointment) {
      return { success: false, error: 'Appointment not found' }
    }

    // 5. If updating datetime or staffId, check for conflicts
    if (input.datetime || input.staffId || input.serviceId) {
      const staffId = input.staffId || existingAppointment.staffId
      const datetime = input.datetime ? new Date(input.datetime) : existingAppointment.datetime

      // Get service duration (either new service or existing)
      let serviceDuration = existingAppointment.service.duration
      if (input.serviceId && input.serviceId !== existingAppointment.serviceId) {
        const newService = await db.service.findUnique({
          where: { id: input.serviceId },
        })
        if (!newService) {
          return { success: false, error: 'Service not found' }
        }
        serviceDuration = newService.duration
      }

      const conflict = await checkConflicts(
        staffId,
        datetime,
        serviceDuration,
        input.id
      )

      if (conflict) {
        return { success: false, error: conflict.details }
      }
    }

    // 6. Check if datetime is being updated (rescheduling)
    const isRescheduling = input.datetime && new Date(input.datetime).getTime() !== existingAppointment.datetime.getTime()

    // 7. Update appointment
    const updatedAppointment = await db.appointment.update({
      where: { id: input.id },
      data: {
        ...(input.clientId && { clientId: input.clientId }),
        ...(input.staffId && { staffId: input.staffId }),
        ...(input.serviceId && { serviceId: input.serviceId }),
        ...(input.datetime && { datetime: new Date(input.datetime) }),
        ...(input.status && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    })

    // 8. Send rescheduling notification if datetime changed (non-blocking)
    if (isRescheduling) {
      try {
        await sendAppointmentRescheduled(
          updatedAppointment.id,
          existingAppointment.datetime,
          updatedAppointment.datetime
        )
      } catch (error) {
        console.error('Failed to send rescheduling notification:', error)
        // Don't fail the update if notification fails
      }
    }

    // 9. Revalidate appointments page
    revalidatePath('/dashboard/appointments')

    return { success: true, data: { id: updatedAppointment.id } }
  } catch (error) {
    console.error('Error updating appointment:', error)
    return { success: false, error: 'Failed to update appointment' }
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Check permissions
    if (session.user.role === Role.CLIENT) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 3. Validate salonId
    if (!session.user.salonId) {
      return { success: false, error: 'No salon associated with user' }
    }

    // 4. Verify appointment exists and belongs to salon
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        salonId: session.user.salonId,
      },
    })

    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    // 5. Update appointment status to CANCELLED
    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    })

    // 6. Send cancellation notification and cancel pending reminders (non-blocking)
    try {
      await sendAppointmentCancellation(appointmentId)
      await cancelPendingReminder(appointmentId)
    } catch (error) {
      console.error('Failed to send cancellation notification:', error)
      // Don't fail the cancellation if notification fails
    }

    // 7. Revalidate appointments page
    revalidatePath('/dashboard/appointments')

    return { success: true, data: { id: updatedAppointment.id } }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return { success: false, error: 'Failed to cancel appointment' }
  }
}

/**
 * Get appointments with optional filtering
 */
export async function getAppointments(
  filter?: AppointmentFilterInput
): Promise<ActionResult<Array<any>>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Check permissions
    if (session.user.role === Role.CLIENT) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 3. Validate salonId
    if (!session.user.salonId) {
      return { success: false, error: 'No salon associated with user' }
    }

    // 4. Build query
    const where: any = {
      salonId: session.user.salonId,
    }

    if (filter?.startDate || filter?.endDate) {
      where.datetime = {}
      if (filter.startDate) {
        where.datetime.gte = new Date(filter.startDate)
      }
      if (filter.endDate) {
        where.datetime.lte = new Date(filter.endDate)
      }
    }

    if (filter?.staffId) {
      where.staffId = filter.staffId
    }

    if (filter?.clientId) {
      where.clientId = filter.clientId
    }

    if (filter?.status) {
      where.status = filter.status
    }

    // 5. Fetch appointments
    const appointments = await db.appointment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
      },
      orderBy: {
        datetime: 'asc',
      },
    })

    return { success: true, data: appointments }
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return { success: false, error: 'Failed to fetch appointments' }
  }
}

/**
 * Check for conflicts without creating an appointment
 * Useful for real-time validation in forms
 */
export async function checkAppointmentConflicts(
  staffId: string,
  serviceId: string,
  datetime: Date | string,
  excludeAppointmentId?: string
): Promise<ActionResult<{ hasConflict: boolean; conflict?: { type: string; details: string } }>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Check permissions
    if (session.user.role === Role.CLIENT) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // 3. Get service to check duration
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // 4. Check for conflicts
    const conflict = await checkConflicts(
      staffId,
      new Date(datetime),
      service.duration,
      excludeAppointmentId
    )

    return {
      success: true,
      data: {
        hasConflict: conflict !== null,
        conflict: conflict || undefined,
      },
    }
  } catch (error) {
    console.error('Error checking conflicts:', error)
    return { success: false, error: 'Failed to check conflicts' }
  }
}

/**
 * Get staff availability for a specific date
 * Returns time slots that are available
 */
export async function getStaffAvailability(
  staffId: string,
  date: Date | string,
  serviceId: string
): Promise<ActionResult<Array<{ time: string; available: boolean }>>> {
  try {
    // 1. Validate user session
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Get service duration
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // 3. Generate time slots for the day (8 AM to 8 PM, 30-minute intervals)
    const targetDate = new Date(date)
    const startHour = 8
    const endHour = 20
    const intervalMinutes = 30
    const slots: Array<{ time: string; available: boolean }> = []

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const slotTime = new Date(targetDate)
        slotTime.setHours(hour, minute, 0, 0)

        // Check if this slot has conflicts
        const conflict = await checkConflicts(
          staffId,
          slotTime,
          service.duration
        )

        slots.push({
          time: slotTime.toISOString(),
          available: conflict === null,
        })
      }
    }

    return { success: true, data: slots }
  } catch (error) {
    console.error('Error getting staff availability:', error)
    return { success: false, error: 'Failed to get staff availability' }
  }
}
