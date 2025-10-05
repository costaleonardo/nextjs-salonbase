# Email Templates

This directory contains React Email components for transactional emails.

## Available Templates

### AppointmentConfirmation.tsx
Sent immediately after an appointment is booked.

**Usage:**
```typescript
import { sendEmail } from '@/lib/email'
import AppointmentConfirmationEmail from '@/components/emails/AppointmentConfirmation'

await sendEmail({
  to: client.email,
  subject: 'Your appointment is confirmed',
  react: AppointmentConfirmationEmail({
    clientName: 'John Doe',
    serviceName: 'Haircut',
    staffName: 'Jane Smith',
    appointmentDate: 'Monday, January 15, 2026',
    appointmentTime: '2:00 PM',
    salonName: 'My Salon',
    salonAddress: '123 Main St, Anytown, USA',
    salonPhone: '(555) 123-4567',
    price: '50.00',
  }),
})
```

### AppointmentReminder.tsx
Sent 24 hours before an appointment.

**Usage:**
```typescript
import { sendEmail } from '@/lib/email'
import AppointmentReminderEmail from '@/components/emails/AppointmentReminder'

await sendEmail({
  to: client.email,
  subject: 'Reminder: Your appointment is tomorrow',
  react: AppointmentReminderEmail({
    clientName: 'John Doe',
    serviceName: 'Haircut',
    staffName: 'Jane Smith',
    appointmentDate: 'Tomorrow, January 16, 2026',
    appointmentTime: '2:00 PM',
    salonName: 'My Salon',
    salonAddress: '123 Main St, Anytown, USA',
    salonPhone: '(555) 123-4567',
  }),
})
```

## Creating New Templates

1. Create a new `.tsx` file in this directory
2. Use `@react-email/components` for consistent styling
3. Export a default React component
4. Follow the naming convention: `{Purpose}Email.tsx`

**Example:**
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface MyEmailProps {
  name: string
}

export const MyEmail = ({ name }: MyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Email preview text</Preview>
      <Body>
        <Container>
          <Heading>Hello {name}</Heading>
          <Text>Your email content here</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MyEmail
```

## Testing Templates

Run the email test script:
```bash
npx tsx scripts/test-email-sms.ts
```

## Environment Variables

Required for email functionality:
```
EMAIL_API_KEY=re_...           # Resend API key
EMAIL_FROM=noreply@example.com # Optional, defaults to noreply@salonbase.app
```
