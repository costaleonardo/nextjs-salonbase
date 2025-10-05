import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import {
  sendAppointmentConfirmationNotification,
  sendAppointmentReminderNotification,
  sendAppointmentCancellationNotification,
  sendAppointmentRescheduledNotification,
} from "@/lib/inngest";

// Create the Inngest API route handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendAppointmentConfirmationNotification,
    sendAppointmentReminderNotification,
    sendAppointmentCancellationNotification,
    sendAppointmentRescheduledNotification,
  ],
});
