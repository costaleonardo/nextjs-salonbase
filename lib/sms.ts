/**
 * SMS Service
 *
 * Uses Twilio for SMS notifications.
 * Handles appointment confirmations, reminders, and other SMS notifications.
 */

import twilio from "twilio";

// Initialize Twilio client
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send an SMS message using Twilio
 */
export async function sendSMS({ to, body }: { to: string; body: string }) {
  if (!twilioClient) {
    console.error("SMS service not configured - Twilio credentials missing");
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: SMS would have been sent", {
        to,
        preview: body.substring(0, 100),
      });
      return { success: true, data: { sid: "dev-mode" } };
    }
    throw new Error("SMS service not configured");
  }

  if (!TWILIO_PHONE_NUMBER) {
    console.error("SMS service not configured - TWILIO_PHONE_NUMBER missing");
    throw new Error("SMS service not configured");
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to,
    });

    return { success: true, data: { sid: message.sid } };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * Example: formatPhoneNumber('555-123-4567', 'US') => '+15551234567'
 */
export function formatPhoneNumber(phone: string, countryCode: string = "US"): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If phone number already starts with country code, return with +
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Add US country code by default
  const defaultCountryCode = countryCode === "US" ? "1" : countryCode;
  return `+${defaultCountryCode}${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // US phone numbers should be 10 digits (or 11 with country code)
  return digits.length === 10 || digits.length === 11;
}
