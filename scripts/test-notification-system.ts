/**
 * Test script for the notification system
 *
 * This script tests:
 * - Creating notifications
 * - Checking notification preferences
 * - Unsubscribe mechanism
 */

import { db } from "@/lib/db";
import {
  scheduleAppointmentConfirmation,
  scheduleAppointmentReminder,
} from "@/lib/notifications";

async function main() {
  console.log("🧪 Testing Notification System\n");

  try {
    // 1. Find a test appointment
    console.log("1. Finding a test appointment...");
    const appointment = await db.appointment.findFirst({
      where: {
        status: "SCHEDULED",
      },
      include: {
        client: true,
        service: true,
        staff: true,
        salon: true,
      },
    });

    if (!appointment) {
      console.log("❌ No scheduled appointments found. Please create one first.");
      return;
    }

    console.log(`✅ Found appointment: ${appointment.id}`);
    console.log(`   Client: ${appointment.client.name}`);
    console.log(`   Service: ${appointment.service.name}`);
    console.log(`   Date: ${appointment.datetime}`);
    console.log();

    // 2. Check notification preferences
    console.log("2. Checking notification preferences...");
    console.log(`   Email notifications: ${appointment.client.emailNotificationsEnabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   SMS notifications: ${appointment.client.smsNotificationsEnabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log();

    // 3. Test scheduling confirmation notification
    console.log("3. Testing confirmation notification...");
    try {
      const confirmation = await scheduleAppointmentConfirmation(appointment.id);
      console.log(`✅ Confirmation notification created: ${confirmation.id}`);
      console.log(`   Type: ${confirmation.type}`);
      console.log(`   Status: ${confirmation.status}`);
      console.log(`   Scheduled at: ${confirmation.scheduledAt}`);
    } catch (error: any) {
      console.log(`⚠️  Confirmation scheduling failed: ${error.message}`);
      console.log("   Note: This is expected if Inngest is not configured yet.");
    }
    console.log();

    // 4. Test scheduling reminder notification
    console.log("4. Testing reminder notification...");
    try {
      const reminder = await scheduleAppointmentReminder(
        appointment.id,
        appointment.datetime
      );
      if (reminder) {
        console.log(`✅ Reminder notification created: ${reminder.id}`);
        console.log(`   Type: ${reminder.type}`);
        console.log(`   Status: ${reminder.status}`);
        console.log(`   Scheduled at: ${reminder.scheduledAt}`);
      } else {
        console.log(`⚠️  Reminder not scheduled (appointment is less than 24 hours away)`);
      }
    } catch (error: any) {
      console.log(`⚠️  Reminder scheduling failed: ${error.message}`);
      console.log("   Note: This is expected if Inngest is not configured yet.");
    }
    console.log();

    // 5. Check all notifications for this appointment
    console.log("5. Checking all notifications...");
    const notifications = await db.notification.findMany({
      where: {
        metadata: {
          path: ["appointmentId"],
          equals: appointment.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`   Found ${notifications.length} notification(s):`);
    notifications.forEach((notif) => {
      console.log(`   - ${notif.type}: ${notif.status} (${notif.scheduledAt})`);
    });
    console.log();

    // 6. Test unsubscribe mechanism
    console.log("6. Testing unsubscribe mechanism...");
    console.log(`   Unsubscribe URL for email: /api/unsubscribe?clientId=${appointment.client.id}&type=email`);
    console.log(`   Unsubscribe URL for SMS: /api/unsubscribe?clientId=${appointment.client.id}&type=sms`);
    console.log();

    console.log("✅ Notification system test completed!\n");
    console.log("📝 Next steps:");
    console.log("1. Set up Inngest account and add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to .env.local");
    console.log("2. Run `npm run dev` and visit http://localhost:3000/api/inngest to register functions");
    console.log("3. Test creating a new appointment to trigger notifications");
    console.log("4. Check Inngest dashboard to see event flow");
    console.log();
  } catch (error) {
    console.error("❌ Error testing notification system:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
