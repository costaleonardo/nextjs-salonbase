/**
 * Test Email and SMS Functionality
 *
 * This script tests the email and SMS services to ensure they are configured correctly.
 */

import { sendEmail } from "@/lib/email";
import { sendSMS, formatPhoneNumber, isValidPhoneNumber } from "@/lib/sms";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmation";
import AppointmentReminderEmail from "@/components/emails/AppointmentReminder";
import { appointmentConfirmationSMS, appointmentReminderSMS } from "@/components/sms/templates";

async function testEmailService() {
  console.log("\n🧪 Testing Email Service...\n");

  // Test 1: Send appointment confirmation email
  console.log("1. Testing appointment confirmation email...");
  const confirmationResult = await sendEmail({
    to: "test@example.com", // Change this to your test email
    subject: "Test: Appointment Confirmation",
    react: AppointmentConfirmationEmail({
      clientName: "John Doe",
      serviceName: "Haircut",
      staffName: "Jane Smith",
      appointmentDate: "Monday, January 15, 2026",
      appointmentTime: "2:00 PM",
      salonName: "Test Salon",
      salonAddress: "123 Main St, Anytown, USA",
      salonPhone: "(555) 123-4567",
      price: "50.00",
    }),
  });

  if (confirmationResult.success) {
    console.log("✅ Appointment confirmation email sent successfully");
    console.log("   Message ID:", confirmationResult.data?.id);
  } else {
    console.log("❌ Failed to send appointment confirmation email");
    console.log("   Error:", confirmationResult.error);
  }

  // Test 2: Send appointment reminder email
  console.log("\n2. Testing appointment reminder email...");
  const reminderResult = await sendEmail({
    to: "test@example.com", // Change this to your test email
    subject: "Test: Appointment Reminder",
    react: AppointmentReminderEmail({
      clientName: "John Doe",
      serviceName: "Haircut",
      staffName: "Jane Smith",
      appointmentDate: "Tomorrow, January 16, 2026",
      appointmentTime: "2:00 PM",
      salonName: "Test Salon",
      salonAddress: "123 Main St, Anytown, USA",
      salonPhone: "(555) 123-4567",
    }),
  });

  if (reminderResult.success) {
    console.log("✅ Appointment reminder email sent successfully");
    console.log("   Message ID:", reminderResult.data?.id);
  } else {
    console.log("❌ Failed to send appointment reminder email");
    console.log("   Error:", reminderResult.error);
  }

  // Test 3: Send plain text email
  console.log("\n3. Testing plain text email...");
  const plainTextResult = await sendEmail({
    to: "test@example.com", // Change this to your test email
    subject: "Test: Plain Text Email",
    text: "This is a plain text test email from SalonBase.",
  });

  if (plainTextResult.success) {
    console.log("✅ Plain text email sent successfully");
    console.log("   Message ID:", plainTextResult.data?.id);
  } else {
    console.log("❌ Failed to send plain text email");
    console.log("   Error:", plainTextResult.error);
  }
}

async function testSMSService() {
  console.log("\n🧪 Testing SMS Service...\n");

  // Test phone number validation
  console.log("1. Testing phone number validation...");
  const testNumbers = [
    "555-123-4567",
    "(555) 123-4567",
    "5551234567",
    "+15551234567",
    "123", // Invalid
  ];

  testNumbers.forEach((number) => {
    const isValid = isValidPhoneNumber(number);
    const formatted = isValid ? formatPhoneNumber(number) : "N/A";
    console.log(
      `   ${number.padEnd(20)} -> Valid: ${isValid ? "✅" : "❌"}  Formatted: ${formatted}`
    );
  });

  // Test 2: Send appointment confirmation SMS
  console.log("\n2. Testing appointment confirmation SMS...");
  const confirmationMessage = appointmentConfirmationSMS({
    salonName: "Test Salon",
    serviceName: "Haircut",
    appointmentDate: "Mon Jan 15",
    appointmentTime: "2:00 PM",
  });
  console.log("   Message preview:", confirmationMessage);
  console.log("   Message length:", confirmationMessage.length, "characters");

  const smsResult = await sendSMS({
    to: "+15551234567", // Change this to your test phone number
    body: confirmationMessage,
  });

  if (smsResult.success) {
    console.log("✅ SMS sent successfully");
    console.log("   Message SID:", smsResult.data?.sid);
  } else {
    console.log("❌ Failed to send SMS");
    console.log("   Error:", smsResult.error);
  }

  // Test 3: Send appointment reminder SMS
  console.log("\n3. Testing appointment reminder SMS...");
  const reminderMessage = appointmentReminderSMS({
    salonName: "Test Salon",
    serviceName: "Haircut",
    appointmentTime: "2:00 PM",
  });
  console.log("   Message preview:", reminderMessage);
  console.log("   Message length:", reminderMessage.length, "characters");

  const reminderSMSResult = await sendSMS({
    to: "+15551234567", // Change this to your test phone number
    body: reminderMessage,
  });

  if (reminderSMSResult.success) {
    console.log("✅ Reminder SMS sent successfully");
    console.log("   Message SID:", reminderSMSResult.data?.sid);
  } else {
    console.log("❌ Failed to send reminder SMS");
    console.log("   Error:", reminderSMSResult.error);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("SalonBase Email & SMS Service Tests");
  console.log("=".repeat(60));

  // Check environment variables
  console.log("\n🔍 Checking environment variables...\n");
  const emailConfigured = !!process.env.EMAIL_API_KEY;
  const smsConfigured =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_PHONE_NUMBER;

  console.log(`EMAIL_API_KEY: ${emailConfigured ? "✅ Configured" : "❌ Missing"}`);
  console.log(
    `TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? "✅ Configured" : "❌ Missing"}`
  );

  // Run tests
  if (emailConfigured) {
    await testEmailService();
  } else {
    console.log("\n⚠️  Skipping email tests - EMAIL_API_KEY not configured");
  }

  if (smsConfigured) {
    await testSMSService();
  } else {
    console.log("\n⚠️  Skipping SMS tests - Twilio credentials not configured");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Tests completed!");
  console.log("=".repeat(60));
}

main().catch(console.error);
