import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { NotificationType } from "@prisma/client";

/**
 * Schedule an appointment confirmation notification
 * Sent immediately after appointment creation
 */
export async function scheduleAppointmentConfirmation(appointmentId: string) {
  try {
    // Create notification record in database
    const notification = await db.notification.create({
      data: {
        type: "APPOINTMENT_CONFIRMATION",
        recipient: "", // Will be filled from appointment data
        scheduledAt: new Date(), // Send immediately
        metadata: { appointmentId },
      },
    });

    // Trigger Inngest event
    await inngest.send({
      name: "appointment/confirmation.send",
      data: {
        appointmentId,
        notificationId: notification.id,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to schedule appointment confirmation:", error);
    throw error;
  }
}

/**
 * Schedule an appointment reminder notification
 * Sent 24 hours before the appointment
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  appointmentDateTime: Date
) {
  try {
    // Calculate reminder time (24 hours before appointment)
    const reminderTime = new Date(appointmentDateTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    // Don't schedule if appointment is less than 24 hours away
    if (reminderTime <= new Date()) {
      console.log("Appointment is less than 24 hours away, skipping reminder");
      return null;
    }

    // Create notification record in database
    const notification = await db.notification.create({
      data: {
        type: "APPOINTMENT_REMINDER",
        recipient: "", // Will be filled from appointment data
        scheduledAt: reminderTime,
        metadata: { appointmentId },
      },
    });

    // Schedule Inngest event with delay
    await inngest.send({
      name: "appointment/reminder.send",
      data: {
        appointmentId,
        notificationId: notification.id,
      },
      ts: reminderTime.getTime(), // Schedule for 24 hours before
    });

    return notification;
  } catch (error) {
    console.error("Failed to schedule appointment reminder:", error);
    throw error;
  }
}

/**
 * Send an appointment cancellation notification
 * Sent immediately when appointment is cancelled
 */
export async function sendAppointmentCancellation(appointmentId: string) {
  try {
    // Create notification record in database
    const notification = await db.notification.create({
      data: {
        type: "APPOINTMENT_CANCELLED",
        recipient: "", // Will be filled from appointment data
        scheduledAt: new Date(), // Send immediately
        metadata: { appointmentId },
      },
    });

    // Trigger Inngest event
    await inngest.send({
      name: "appointment/cancellation.send",
      data: {
        appointmentId,
        notificationId: notification.id,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to send appointment cancellation:", error);
    throw error;
  }
}

/**
 * Send an appointment rescheduled notification
 * Sent immediately when appointment is rescheduled
 */
export async function sendAppointmentRescheduled(
  appointmentId: string,
  oldDateTime: Date,
  newDateTime: Date
) {
  try {
    // Create notification record in database
    const notification = await db.notification.create({
      data: {
        type: "APPOINTMENT_RESCHEDULED",
        recipient: "", // Will be filled from appointment data
        scheduledAt: new Date(), // Send immediately
        metadata: { appointmentId, oldDateTime: oldDateTime.toISOString() },
      },
    });

    // Trigger Inngest event
    await inngest.send({
      name: "appointment/rescheduled.send",
      data: {
        appointmentId,
        notificationId: notification.id,
        oldDateTime: oldDateTime.toISOString(),
      },
    });

    // Cancel old reminder and schedule new one
    await cancelPendingReminder(appointmentId);
    await scheduleAppointmentReminder(appointmentId, newDateTime);

    return notification;
  } catch (error) {
    console.error("Failed to send appointment rescheduled notification:", error);
    throw error;
  }
}

/**
 * Cancel all pending notifications for an appointment
 */
export async function cancelPendingReminder(appointmentId: string) {
  try {
    // Update all pending reminder notifications to CANCELLED
    await db.notification.updateMany({
      where: {
        metadata: {
          path: ["appointmentId"],
          equals: appointmentId,
        },
        type: "APPOINTMENT_REMINDER",
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });
  } catch (error) {
    console.error("Failed to cancel pending reminders:", error);
    // Don't throw - this is a best-effort cleanup
  }
}

/**
 * Helper function to get notification preferences for a client
 * This will be used when we implement the unsubscribe mechanism
 */
export async function getNotificationPreferences(clientId: string) {
  // TODO: Implement notification preferences in Client model
  // For now, assume all notifications are enabled
  return {
    emailEnabled: true,
    smsEnabled: true,
    confirmationEnabled: true,
    reminderEnabled: true,
  };
}
