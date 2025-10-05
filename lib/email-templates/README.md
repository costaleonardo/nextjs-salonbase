# Email Templates

This directory contains React-based email templates for transactional emails.

## Available Templates

### Receipt Email ([receipt.tsx](receipt.tsx))

Professional payment receipt template sent to clients after successful payment.

**Features:**
- Clean, professional design
- Mobile-responsive layout
- Displays salon information
- Shows appointment details
- Payment summary with gift certificate tracking
- Transaction ID for reference
- Thank you message

**Usage:**

```typescript
import { sendReceipt } from '@/app/actions/receipts'

// Send receipt after payment completion
await sendReceipt(paymentId)

// Or send to a specific email
await sendReceipt(paymentId, 'client@example.com')
```

## Email Service Setup

This project uses [Resend](https://resend.com) for sending transactional emails.

### Configuration

1. Sign up for a Resend account at https://resend.com
2. Get your API key from the dashboard
3. Add to `.env.local`:

```bash
EMAIL_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

4. Verify your sending domain in Resend dashboard (required for production)

### Development Mode

In development mode without `EMAIL_API_KEY`, emails will be logged to console instead of sent.

## Testing Email Templates

To preview email templates during development:

```typescript
import { renderEmailToHtml } from '@/lib/email'
import ReceiptEmail from '@/lib/email-templates/receipt'

const html = renderEmailToHtml(
  ReceiptEmail({
    salonName: 'Test Salon',
    clientName: 'John Doe',
    // ... other props
  })
)

console.log(html) // Or save to file for preview
```

## Adding New Templates

1. Create a new `.tsx` file in this directory
2. Export a React component that returns valid HTML email markup
3. Use inline styles (external CSS not supported in emails)
4. Test across email clients (Gmail, Outlook, Apple Mail)
5. Keep design simple and mobile-friendly

### Example Template Structure

```tsx
export interface MyEmailData {
  recipientName: string
  // ... other props
}

export const MyEmail = ({ recipientName }: MyEmailData) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'sans-serif' }}>
        <h1>Hello {recipientName}</h1>
        {/* ... */}
      </body>
    </html>
  )
}
```

## Email Best Practices

- **Use inline styles**: CSS in `<style>` tags may not work in all email clients
- **Use tables for layout**: `<table>` elements provide better cross-client compatibility
- **Set explicit widths**: Avoid relying on automatic sizing
- **Test thoroughly**: Use services like Litmus or Email on Acid
- **Include plain text version**: For accessibility and spam filtering
- **Keep it simple**: Avoid complex JavaScript or interactive elements
- **Optimize images**: Host images on CDN, use appropriate compression
- **Include alt text**: For images, for accessibility

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [Resend Documentation](https://resend.com/docs)
- [Email Client CSS Support](https://www.caniemail.com/)
