# SMS Templates

This directory contains SMS message templates for notifications.

## Available Templates

All templates are defined in `templates.ts`:

### appointmentConfirmationSMS

Sent immediately after an appointment is booked.

**Usage:**

```typescript
import { sendSMS } from "@/lib/sms";
import { appointmentConfirmationSMS } from "@/components/sms/templates";

const message = appointmentConfirmationSMS({
  salonName: "My Salon",
  serviceName: "Haircut",
  appointmentDate: "Mon Jan 15",
  appointmentTime: "2:00 PM",
});

await sendSMS({
  to: "+15551234567",
  body: message,
});
```

### appointmentReminderSMS

Sent 24 hours before an appointment.

**Usage:**

```typescript
import { sendSMS } from "@/lib/sms";
import { appointmentReminderSMS } from "@/components/sms/templates";

const message = appointmentReminderSMS({
  salonName: "My Salon",
  serviceName: "Haircut",
  appointmentTime: "2:00 PM",
});

await sendSMS({
  to: "+15551234567",
  body: message,
});
```

### Other Templates

- `appointmentCancellationSMS` - Sent when an appointment is cancelled
- `appointmentRescheduledSMS` - Sent when an appointment is rescheduled
- `paymentReceiptSMS` - Sent after a payment is received

## Phone Number Format

All phone numbers must be in E.164 format (e.g., `+15551234567`).

Use the helper functions:

```typescript
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/sms";

const phone = "555-123-4567";
if (isValidPhoneNumber(phone)) {
  const formatted = formatPhoneNumber(phone); // Returns: +15551234567
  await sendSMS({ to: formatted, body: message });
}
```

## SMS Best Practices

1. **Keep it concise**: Aim for under 160 characters to avoid multi-part messages
2. **Include salon name**: Always identify who is sending the message
3. **Be clear and actionable**: State the purpose clearly
4. **Respect opt-outs**: Honor STOP/UNSUBSCRIBE requests (Twilio handles this automatically)
5. **Timing matters**: Don't send SMS late at night or early morning

## Creating New Templates

Add new templates to `templates.ts`:

```typescript
interface MyTemplateSMSParams {
  name: string;
  detail: string;
}

export function myTemplateSMS({ name, detail }: MyTemplateSMSParams): string {
  return `Hello ${name}, ${detail}. Reply STOP to unsubscribe.`;
}
```

## Testing Templates

Run the SMS test script:

```bash
npx tsx scripts/test-email-sms.ts
```

## Environment Variables

Required for SMS functionality:

```
TWILIO_ACCOUNT_SID=AC...         # Twilio Account SID
TWILIO_AUTH_TOKEN=...            # Twilio Auth Token
TWILIO_PHONE_NUMBER=+1...        # Your Twilio phone number (E.164 format)
```

## Cost Considerations

- **US SMS**: ~$0.0079 per message
- **International SMS**: Varies by country
- **Consider email as primary**: Use SMS for time-sensitive notifications only

## Compliance

- **TCPA Compliance**: Obtain consent before sending SMS
- **Opt-out mechanism**: Must include opt-out instructions (Twilio handles STOP automatically)
- **Timing restrictions**: Don't send before 8 AM or after 9 PM local time
