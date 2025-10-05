# Testing Stripe Webhooks

This guide explains how to test Stripe webhooks locally using the Stripe CLI.

## Prerequisites

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

## Testing Locally

### 1. Start the development server

```bash
npm run dev
```

### 2. Forward webhooks to local endpoint

In a new terminal window:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like: `whsec_...`

### 3. Add webhook secret to .env.local

```bash
# Add to .env.local
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Restart your dev server after adding the secret.

### 4. Trigger test events

#### Test payment_intent.succeeded

```bash
stripe trigger payment_intent.succeeded
```

#### Test payment_intent.payment_failed

```bash
stripe trigger payment_intent.payment_failed
```

#### Test charge.refunded

```bash
stripe trigger charge.refunded
```

### 5. Verify webhook handling

Check your terminal logs for:
- `[Stripe Webhook] Received event: payment_intent.succeeded`
- `[Stripe Webhook] Payment X marked as COMPLETED`
- Database updates in Prisma Studio

## Testing with Real Payments

To test with actual payment flows:

1. Create a Payment Intent through your app
2. The webhook will automatically fire when the payment succeeds/fails
3. Check the database to verify status updates and audit logs

## Monitoring Webhooks

### View webhook events in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on individual events to see request/response details
3. Check for any failed webhook deliveries

### Check audit logs in database

```bash
npm run db:studio
```

Navigate to `PaymentAuditLog` table to see all webhook events logged.

## Production Setup

### 1. Create webhook endpoint in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

### 2. Add webhook secret to production environment

Copy the webhook signing secret from Stripe and add to Vercel:

```bash
# Vercel CLI
vercel env add STRIPE_WEBHOOK_SECRET production
```

Or add via Vercel dashboard: Settings → Environment Variables

## Troubleshooting

### Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Restart dev server after changing environment variables
- Use the secret from `stripe listen` output for local testing

### Payment not found for PaymentIntent

- Ensure payment was created in database with correct `stripePaymentId`
- Check that the Payment Intent ID matches between Stripe and database

### No logs appearing

- Check that webhook endpoint is receiving requests
- Verify `stripe listen` is running and forwarding correctly
- Check server logs for errors

## Expected Behavior

### payment_intent.succeeded
- Payment status: `PENDING` → `COMPLETED`
- Audit log created with action: `payment_succeeded`
- Metadata updated with completion timestamp

### payment_intent.payment_failed
- Payment status: `PENDING` → `FAILED`
- Audit log created with action: `payment_failed`
- Error details stored in metadata

### charge.refunded
- Payment status: `COMPLETED` → `REFUNDED`
- Audit log created with action: `payment_refunded`
- Refunded amount stored in metadata
