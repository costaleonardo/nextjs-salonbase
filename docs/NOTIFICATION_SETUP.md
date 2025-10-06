# Notification System Setup Guide

This guide explains how to set up and use the notification system in SalonBase.

## Overview

The notification system automatically sends email and SMS notifications for:

- **Appointment Confirmations** - Sent immediately when an appointment is created
- **Appointment Reminders** - Sent 24 hours before the appointment
- **Appointment Cancellations** - Sent immediately when an appointment is cancelled
- **Appointment Rescheduled** - Sent immediately when an appointment is rescheduled

## Architecture

The system uses:

- **Inngest** - Event-driven background job queue
- **Resend** - Email delivery service
- **Twilio** - SMS delivery service
- **PostgreSQL** - Notification tracking and audit trail

## Setup Instructions

### 1. Set Up Inngest (Required)

Inngest is required to queue and process notification jobs.

1. Create a free account at [inngest.com](https://www.inngest.com/)
2. Create a new project
3. Get your API keys from the Inngest dashboard
4. Add to `.env.local`:
   ```bash
   INNGEST_EVENT_KEY="your-event-key"
   INNGEST_SIGNING_KEY="your-signing-key"
   ```

### 2. Register Inngest Functions

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/api/inngest` in your browser

3. Follow the instructions to connect your local app to Inngest Dev Server

4. Your notification functions will be automatically registered:
   - `send-appointment-confirmation`
   - `send-appointment-reminder`
   - `send-appointment-cancellation`
   - `send-appointment-rescheduled`

### 3. Configure Email (Optional but Recommended)

Email notifications require a Resend API key:

1. Create account at [resend.com](https://resend.com/)
2. Get your API key
3. Add to `.env.local`:
   ```bash
   EMAIL_API_KEY="re_..."
   EMAIL_FROM="noreply@yourdomain.com"  # Optional
   ```

### 4. Configure SMS (Optional but Recommended)

SMS notifications require Twilio credentials:

1. Create account at [twilio.com](https://www.twilio.com/)
2. Get a phone number
3. Get your Account SID and Auth Token
4. Add to `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID="AC..."
   TWILIO_AUTH_TOKEN="..."
   TWILIO_PHONE_NUMBER="+1..."  # E.164 format
   ```

### 5. Set Your App URL

For unsubscribe links to work correctly:

```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # Production
NEXT_PUBLIC_APP_URL="http://localhost:3000"   # Development
```

## Testing

Run the test script to verify everything is working:

```bash
npx tsx scripts/test-notification-system.ts
```

This will:

1. Find a test appointment
2. Check notification preferences
3. Schedule a confirmation notification
4. Schedule a reminder notification
5. Display unsubscribe URLs

## How It Works

### Automatic Notifications

When an appointment is created, updated, or cancelled, notifications are automatically scheduled:

```typescript
// In app/actions/appointments.ts

// After creating an appointment
await scheduleAppointmentConfirmation(appointment.id);
await scheduleAppointmentReminder(appointment.id, appointment.datetime);

// After cancelling an appointment
await sendAppointmentCancellation(appointmentId);
await cancelPendingReminder(appointmentId);

// After rescheduling an appointment
await sendAppointmentRescheduled(appointmentId, oldDateTime, newDateTime);
```

### Notification Flow

1. **Event Triggered** - Appointment action triggers notification
2. **Database Record** - Notification record created in `Notification` table
3. **Inngest Event** - Event sent to Inngest queue
4. **Processing** - Inngest function processes event (sends email/SMS)
5. **Status Update** - Notification status updated (SENT/FAILED)

### Notification Preferences

Clients can unsubscribe from notifications:

- **Email Unsubscribe**: Click link in email footer
- **SMS Unsubscribe**: Handled automatically by Twilio (STOP keyword)

Preferences are stored in the `Client` model:

- `emailNotificationsEnabled` (default: true)
- `smsNotificationsEnabled` (default: true)

Notifications will respect these preferences before sending.

### Unsubscribe URLs

Email templates include unsubscribe links:

```
/api/unsubscribe?clientId={id}&type=email
/api/unsubscribe?clientId={id}&type=sms
```

## Database Schema

### Notification Model

```prisma
model Notification {
  id          String             @id @default(cuid())
  type        NotificationType   // APPOINTMENT_CONFIRMATION, APPOINTMENT_REMINDER, etc.
  recipient   String             // Email or phone number
  status      NotificationStatus // PENDING, SENT, FAILED, CANCELLED
  scheduledAt DateTime           // When to send
  sentAt      DateTime?          // When actually sent
  metadata    Json?              // Additional context (appointmentId, etc.)
  error       String?            // Error message if failed
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Client Model

```prisma
model Client {
  // ... other fields
  emailNotificationsEnabled Boolean @default(true)
  smsNotificationsEnabled   Boolean @default(true)
}
```

## Monitoring

### Check Notification Status

Query notifications for an appointment:

```typescript
const notifications = await db.notification.findMany({
  where: {
    metadata: {
      path: ["appointmentId"],
      equals: appointmentId,
    },
  },
  orderBy: { createdAt: "desc" },
});
```

### Inngest Dashboard

Monitor notification jobs in the Inngest dashboard:

- View event history
- Check function runs
- Debug failures
- View logs

## Troubleshooting

### Notifications Not Sending

1. **Check Inngest Connection**
   - Visit `/api/inngest` to verify functions are registered
   - Check Inngest dashboard for events

2. **Check API Keys**
   - Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set
   - Verify `EMAIL_API_KEY` (Resend) is valid
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are valid

3. **Check Client Preferences**
   - Verify `emailNotificationsEnabled` / `smsNotificationsEnabled` are true

4. **Check Notification Records**
   - Query `Notification` table for status
   - Check `error` field for failure reasons

### Email Template Issues

Test email rendering:

```typescript
import { renderEmailToHtml } from "@/lib/email";
import { AppointmentConfirmation } from "@/components/emails/AppointmentConfirmation";

const html = await renderEmailToHtml(
  AppointmentConfirmation({
    /* props */
  })
);
console.log(html);
```

### SMS Issues

1. **Phone Number Format** - Must be E.164 format (+1XXXXXXXXXX)
2. **Twilio Verification** - Verify phone numbers in test mode
3. **STOP Keyword** - Client may have opted out via STOP

## Best Practices

1. **Non-Blocking** - Notifications never fail appointments
2. **Audit Trail** - All notifications tracked in database
3. **Error Handling** - Failures logged but don't crash
4. **Preferences** - Always respect client preferences
5. **Testing** - Test in development before production

## Production Deployment

1. **Inngest Production**
   - Create production app in Inngest
   - Use production API keys
   - Configure webhook URL

2. **Email Production**
   - Verify your domain in Resend
   - Use production API key
   - Configure SPF/DKIM records

3. **SMS Production**
   - Upgrade Twilio account (remove trial restrictions)
   - Configure messaging service
   - Monitor usage and costs

4. **Environment Variables**
   - Set all variables in production environment
   - Verify `NEXT_PUBLIC_APP_URL` is correct

## Support

For issues with:

- **Inngest** - [inngest.com/docs](https://www.inngest.com/docs)
- **Resend** - [resend.com/docs](https://resend.com/docs)
- **Twilio** - [twilio.com/docs](https://www.twilio.com/docs)
