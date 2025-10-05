# Receipt Generation System

## Overview

The receipt generation system automatically sends professional payment receipts to clients via email after successful payment completion. This document outlines the implementation, usage, and testing procedures.

## Architecture

### Components

1. **Email Template** ([lib/email-templates/receipt.tsx](../lib/email-templates/receipt.tsx))
   - React-based email component
   - Mobile-responsive design
   - Supports gift certificate display
   - Professional layout with salon branding

2. **Email Service** ([lib/email.ts](../lib/email.ts))
   - Resend API integration
   - Development mode fallback
   - Email rendering utilities

3. **Receipt Actions** ([app/actions/receipts.ts](../app/actions/receipts.ts))
   - `sendReceipt(paymentId, recipientEmail?)` - Send receipt email
   - `resendReceipt(paymentId, recipientEmail?)` - Resend receipt to same/different email
   - `getReceiptData(paymentId)` - Get receipt data for preview

4. **Payment Integration** ([app/actions/payments.ts](../app/actions/payments.ts))
   - Automatic receipt sending after payment completion
   - Non-blocking email delivery (payment succeeds even if email fails)
   - Audit logging for email send attempts

## Features

### Receipt Content

- **Salon Information**: Name, address, phone, email
- **Client Details**: Name and email
- **Appointment Information**: Date, time, service, provider
- **Payment Summary**:
  - Total amount paid
  - Payment method
  - Payment date
  - Transaction ID (for credit card payments)
  - Gift certificate applied (if applicable)
- **Receipt Number**: Unique identifier (format: `RCPT-YYYYMMDD-XXXXX`)
- **Professional Design**: Clean, branded layout

### Automatic Delivery

Receipts are automatically sent when:
- A payment is completed via `processPayment()`
- A Stripe payment is confirmed via `confirmStripePayment()`

Email delivery is **non-blocking** - payment completion is not dependent on email success. Failed email attempts are logged to the payment audit log.

## Setup

### 1. Email Service Configuration

Sign up for Resend and configure environment variables:

```bash
# .env.local
EMAIL_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

### 2. Domain Verification

For production, verify your sending domain in the Resend dashboard:
1. Go to https://resend.com/domains
2. Add your domain
3. Configure DNS records (SPF, DKIM, DMARC)

### 3. Development Mode

Without `EMAIL_API_KEY`, the system operates in development mode:
- Emails are logged to console instead of sent
- Useful for local development and testing

## Usage

### Server Actions

```typescript
import { sendReceipt, resendReceipt } from '@/app/actions/receipts'

// Send receipt to client's email on file
const result = await sendReceipt(paymentId)

// Send receipt to specific email
const result = await sendReceipt(paymentId, 'custom@email.com')

// Resend receipt (e.g., client didn't receive original)
const result = await resendReceipt(paymentId)

// Get receipt data for preview
const receiptData = await getReceiptData(paymentId)
```

### Automatic Sending

Receipts are automatically sent after successful payment:

```typescript
// This happens automatically in processPayment() and confirmStripePayment()
// No additional code needed
```

### Manual UI Integration

For a "Resend Receipt" button in the dashboard:

```typescript
'use client'

import { resendReceipt } from '@/app/actions/receipts'

export function ResendReceiptButton({ paymentId }: { paymentId: string }) {
  const [sending, setSending] = useState(false)

  const handleResend = async () => {
    setSending(true)
    const result = await resendReceipt(paymentId)
    setSending(false)

    if (result.success) {
      alert('Receipt sent successfully!')
    } else {
      alert(`Failed to send receipt: ${result.error}`)
    }
  }

  return (
    <button onClick={handleResend} disabled={sending}>
      {sending ? 'Sending...' : 'Resend Receipt'}
    </button>
  )
}
```

## Testing

### Test Email Template Rendering

Generate HTML previews of receipt templates:

```bash
npm run test:receipts
```

This generates two HTML files in the project root:
- `test-receipt-standard.html` - Standard receipt
- `test-receipt-with-giftcert.html` - Receipt with gift certificate applied

Open these files in a browser to preview the email design.

### Test Email Delivery

To test actual email delivery:

1. Configure `EMAIL_API_KEY` in `.env.local`
2. Create a test payment in the database
3. Call `sendReceipt()` with the payment ID:

```typescript
import { sendReceipt } from '@/app/actions/receipts'

const result = await sendReceipt('payment_id_here', 'your-test-email@example.com')
console.log(result)
```

### Verify Email Metadata

After sending a receipt, check the payment metadata:

```typescript
const payment = await db.payment.findUnique({
  where: { id: paymentId }
})

console.log(payment.metadata)
// Should include:
// - receiptSent: true
// - receiptSentAt: ISO timestamp
// - receiptSentTo: email address
// - receiptEmailId: Resend email ID
```

## Receipt Metadata

When a receipt is successfully sent, the payment record is updated with metadata:

```typescript
{
  receiptSent: true,
  receiptSentAt: "2026-01-15T14:30:00.000Z",
  receiptSentTo: "client@example.com",
  receiptEmailId: "re_abc123..." // Resend email ID
}
```

This allows tracking:
- Whether a receipt was sent
- When it was sent
- To which email address
- The Resend email ID for debugging

## Audit Logging

Receipt send attempts are logged to `PaymentAuditLog`:

- **Success**: Action `receipt_sent` with email details
- **Failure**: Action `receipt_send_failed` with error message

View audit logs:

```typescript
import { getPaymentAuditLog } from '@/app/actions/payments'

const logs = await getPaymentAuditLog(paymentId)
console.log(logs.data)
```

## Troubleshooting

### Receipt Not Sending

1. **Check Environment Variables**
   - Verify `EMAIL_API_KEY` is set in `.env.local`
   - Verify `EMAIL_FROM` is configured

2. **Check Client Email**
   - Ensure client record has a valid email address
   - Or provide email explicitly: `sendReceipt(paymentId, 'email@example.com')`

3. **Check Audit Logs**
   - Look for `receipt_send_failed` entries
   - Check error message for details

4. **Resend API Status**
   - Check Resend dashboard for delivery status
   - Verify domain is verified (for production)

### Email Goes to Spam

1. Verify SPF, DKIM, and DMARC records
2. Use a verified domain (not free email provider)
3. Check Resend deliverability guidelines

### Template Not Rendering Correctly

1. Test with `npm run test:receipts`
2. Open generated HTML in multiple browsers
3. Test in email clients (Gmail, Outlook, Apple Mail)
4. Avoid complex CSS (use inline styles)

## Future Enhancements

Optional improvements for future iterations:

1. **PDF Generation**
   - Generate PDF receipts for download
   - Attach to email for archival
   - Libraries: `@react-pdf/renderer` or `puppeteer`

2. **Custom Branding**
   - Upload salon logo
   - Customize colors/fonts
   - Per-salon email templates

3. **Multi-Language Support**
   - Translate receipt templates
   - Detect client language preference

4. **SMS Receipts**
   - Send receipt link via SMS
   - Useful when email not available

## API Reference

### `sendReceipt(paymentId: string, recipientEmail?: string)`

Sends receipt email to client.

**Parameters:**
- `paymentId` - ID of completed payment
- `recipientEmail` - (Optional) Override client email

**Returns:**
```typescript
{
  success: boolean
  data?: {
    receiptNumber: string
    sentTo: string
    emailId: string
  }
  error?: string
}
```

### `resendReceipt(paymentId: string, recipientEmail?: string)`

Resends receipt email. Alias for `sendReceipt()`.

### `getReceiptData(paymentId: string)`

Retrieves receipt data without sending email.

**Returns:**
```typescript
{
  success: boolean
  data?: ReceiptEmailData
  error?: string
}
```

## Related Files

- [lib/email-templates/receipt.tsx](../lib/email-templates/receipt.tsx) - Email template
- [lib/email.ts](../lib/email.ts) - Email service
- [app/actions/receipts.ts](../app/actions/receipts.ts) - Receipt actions
- [app/actions/payments.ts](../app/actions/payments.ts) - Payment integration
- [scripts/test-receipt-generation.ts](../scripts/test-receipt-generation.ts) - Test script
- [.env.example](../.env.example) - Environment variables template

## Support

For issues or questions:
1. Check audit logs for error details
2. Review Resend dashboard for delivery status
3. Verify environment configuration
4. Test email template rendering with `npm run test:receipts`
