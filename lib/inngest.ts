import { Inngest, EventSchemas } from "inngest";
import { db } from "@/lib/db";
import { sendEmailFromComponent } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import {
  appointmentConfirmationSMS,
  appointmentReminderSMS,
  appointmentCancellationSMS,
  appointmentRescheduledSMS,
  paymentReceiptSMS,
} from "@/components/sms/templates";
import { AppointmentConfirmation } from "@/components/emails/AppointmentConfirmation";
import { AppointmentReminder } from "@/components/emails/AppointmentReminder";

// Define event schemas for type safety
type Events = {
  "appointment/confirmation.send": {
    data: {
      appointmentId: string;
      notificationId: string;
    };
  };
  "appointment/reminder.send": {
    data: {
      appointmentId: string;
      notificationId: string;
    };
  };
  "appointment/cancellation.send": {
    data: {
      appointmentId: string;
      notificationId: string;
    };
  };
  "appointment/rescheduled.send": {
    data: {
      appointmentId: string;
      notificationId: string;
      oldDateTime: string;
    };
  };
};

// Create Inngest client
export const inngest = new Inngest({
  id: "salonbase",
  schemas: new EventSchemas().fromRecord<Events>(),
});

// Helper function to update notification status
async function updateNotificationStatus(
  notificationId: string,
  status: "SENT" | "FAILED",
  error?: string
) {
  await db.notification.update({
    where: { id: notificationId },
    data: {
      status,
      sentAt: status === "SENT" ? new Date() : undefined,
      error: error || null,
    },
  });
}

// Appointment confirmation notification
export const sendAppointmentConfirmationNotification = inngest.createFunction(
  { id: "send-appointment-confirmation", name: "Send Appointment Confirmation" },
  { event: "appointment/confirmation.send" },
  async ({ event, step }) => {
    const { appointmentId, notificationId } = event.data;

    // Fetch appointment with all related data
    const appointment = await step.run("fetch-appointment", async () => {
      return await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      });
    });

    if (!appointment) {
      await updateNotificationStatus(
        notificationId,
        "FAILED",
        "Appointment not found"
      );
      throw new Error("Appointment not found");
    }

    const { client, service, staff, salon } = appointment;

    // Send email if client has email and email notifications are enabled
    if (client.email && client.emailNotificationsEnabled) {
      await step.run("send-confirmation-email", async () => {
        try {
          await sendEmailFromComponent({
            to: client.email!,
            subject: `Appointment Confirmed - ${salon.name}`,
            component: AppointmentConfirmation({
              clientName: client.name,
              serviceName: service.name,
              staffName: staff.name,
              dateTime: appointment.datetime,
              duration: service.duration,
              price: service.price.toString(),
              salonName: salon.name,
              salonAddress: salon.address || "",
              salonPhone: salon.phone || "",
            }),
          });
        } catch (error) {
          console.error("Failed to send confirmation email:", error);
          throw error;
        }
      });
    }

    // Send SMS if client has phone and SMS notifications are enabled
    if (client.phone && client.smsNotificationsEnabled) {
      await step.run("send-confirmation-sms", async () => {
        try {
          const smsMessage = appointmentConfirmationSMS({
            clientName: client.name,
            salonName: salon.name,
            serviceName: service.name,
            dateTime: appointment.datetime,
          });

          await sendSMS({
            to: client.phone!,
            body: smsMessage,
          });
        } catch (error) {
          console.error("Failed to send confirmation SMS:", error);
          // Don't throw - email might have succeeded
        }
      });
    }

    // Update notification status
    await step.run("update-notification-status", async () => {
      await updateNotificationStatus(notificationId, "SENT");
    });

    return { success: true };
  }
);

// Appointment reminder notification (24 hours before)
export const sendAppointmentReminderNotification = inngest.createFunction(
  { id: "send-appointment-reminder", name: "Send Appointment Reminder" },
  { event: "appointment/reminder.send" },
  async ({ event, step }) => {
    const { appointmentId, notificationId } = event.data;

    // Fetch appointment with all related data
    const appointment = await step.run("fetch-appointment", async () => {
      return await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      });
    });

    if (!appointment) {
      await updateNotificationStatus(
        notificationId,
        "FAILED",
        "Appointment not found"
      );
      throw new Error("Appointment not found");
    }

    // Check if appointment was cancelled
    if (appointment.status === "CANCELLED") {
      await updateNotificationStatus(
        notificationId,
        "CANCELLED",
        "Appointment was cancelled"
      );
      return { success: false, reason: "Appointment was cancelled" };
    }

    const { client, service, staff, salon } = appointment;

    // Send email if client has email and email notifications are enabled
    if (client.email && client.emailNotificationsEnabled) {
      await step.run("send-reminder-email", async () => {
        try {
          await sendEmailFromComponent({
            to: client.email!,
            subject: `Reminder: Your appointment tomorrow at ${salon.name}`,
            component: AppointmentReminder({
              clientName: client.name,
              serviceName: service.name,
              staffName: staff.name,
              dateTime: appointment.datetime,
              duration: service.duration,
              price: service.price.toString(),
              salonName: salon.name,
              salonAddress: salon.address || "",
              salonPhone: salon.phone || "",
            }),
          });
        } catch (error) {
          console.error("Failed to send reminder email:", error);
          throw error;
        }
      });
    }

    // Send SMS if client has phone and SMS notifications are enabled
    if (client.phone && client.smsNotificationsEnabled) {
      await step.run("send-reminder-sms", async () => {
        try {
          const smsMessage = appointmentReminderSMS({
            clientName: client.name,
            salonName: salon.name,
            serviceName: service.name,
            dateTime: appointment.datetime,
          });

          await sendSMS({
            to: client.phone!,
            body: smsMessage,
          });
        } catch (error) {
          console.error("Failed to send reminder SMS:", error);
          // Don't throw - email might have succeeded
        }
      });
    }

    // Update notification status
    await step.run("update-notification-status", async () => {
      await updateNotificationStatus(notificationId, "SENT");
    });

    return { success: true };
  }
);

// Appointment cancellation notification
export const sendAppointmentCancellationNotification = inngest.createFunction(
  { id: "send-appointment-cancellation", name: "Send Appointment Cancellation" },
  { event: "appointment/cancellation.send" },
  async ({ event, step }) => {
    const { appointmentId, notificationId } = event.data;

    // Fetch appointment with all related data
    const appointment = await step.run("fetch-appointment", async () => {
      return await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      });
    });

    if (!appointment) {
      await updateNotificationStatus(
        notificationId,
        "FAILED",
        "Appointment not found"
      );
      throw new Error("Appointment not found");
    }

    const { client, service, salon } = appointment;

    // Send SMS if client has phone and SMS notifications are enabled
    if (client.phone && client.smsNotificationsEnabled) {
      await step.run("send-cancellation-sms", async () => {
        try {
          const smsMessage = appointmentCancellationSMS({
            clientName: client.name,
            salonName: salon.name,
            serviceName: service.name,
            dateTime: appointment.datetime,
          });

          await sendSMS({
            to: client.phone!,
            body: smsMessage,
          });
        } catch (error) {
          console.error("Failed to send cancellation SMS:", error);
          throw error;
        }
      });
    }

    // Update notification status
    await step.run("update-notification-status", async () => {
      await updateNotificationStatus(notificationId, "SENT");
    });

    return { success: true };
  }
);

// Appointment rescheduled notification
export const sendAppointmentRescheduledNotification = inngest.createFunction(
  { id: "send-appointment-rescheduled", name: "Send Appointment Rescheduled" },
  { event: "appointment/rescheduled.send" },
  async ({ event, step }) => {
    const { appointmentId, notificationId, oldDateTime } = event.data;

    // Fetch appointment with all related data
    const appointment = await step.run("fetch-appointment", async () => {
      return await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          service: true,
          staff: true,
          salon: true,
        },
      });
    });

    if (!appointment) {
      await updateNotificationStatus(
        notificationId,
        "FAILED",
        "Appointment not found"
      );
      throw new Error("Appointment not found");
    }

    const { client, service, salon } = appointment;

    // Send SMS if client has phone and SMS notifications are enabled
    if (client.phone && client.smsNotificationsEnabled) {
      await step.run("send-rescheduled-sms", async () => {
        try {
          const smsMessage = appointmentRescheduledSMS({
            clientName: client.name,
            salonName: salon.name,
            serviceName: service.name,
            oldDateTime: new Date(oldDateTime),
            newDateTime: appointment.datetime,
          });

          await sendSMS({
            to: client.phone!,
            body: smsMessage,
          });
        } catch (error) {
          console.error("Failed to send rescheduled SMS:", error);
          throw error;
        }
      });
    }

    // Update notification status
    await step.run("update-notification-status", async () => {
      await updateNotificationStatus(notificationId, "SENT");
    });

    return { success: true };
  }
);
