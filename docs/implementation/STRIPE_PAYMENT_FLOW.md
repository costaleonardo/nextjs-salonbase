# Stripe Payment Flow Implementation

## Overview

This document describes the complete Stripe payment integration implemented for the SalonBase MVP, including Payment Intents, Stripe Elements, 3D Secure authentication, and mobile optimization.

## Architecture

### Components Created

1. **API Endpoint**
   - `app/api/payments/create-intent/route.ts` - Creates Stripe Payment Intents

2. **Client Components**
   - `components/payment/StripePaymentWrapper.tsx` - Initializes Stripe Elements
   - `components/payment/StripeCardInput.tsx` - Mobile-optimized card input form
   - `components/payment/PaymentConfirmationDialog.tsx` - Explicit payment confirmation UI
   - `components/payment/PaymentResultDialog.tsx` - Payment result display

3. **Server Actions**
   - `app/actions/payments.ts:confirmStripePayment()` - Confirms successful payments

4. **Testing & Documentation**
   - `scripts/test-stripe-payment-flow.ts` - Automated test suite
   - `docs/testing/STRIPE_PAYMENT_TESTING.md` - Comprehensive testing guide

## Payment Flow

### 1. Payment Initialization

```typescript
// Client requests Payment Intent creation
POST /api/payments/create-intent
{
  "appointmentId": "apt_123",
  "amount": 50.00
}

// Server responds with client secret
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

### 2. Card Input & Validation

- Stripe Elements renders card input form
- Real-time validation for card number, expiry, CVC
- Mobile-optimized with 16px font size (prevents iOS zoom)
- Touch targets minimum 44x44px
- Autofill support enabled

### 3. Payment Confirmation

- User enters card details
- Clicks "Pay $X.XX" button
- Stripe handles:
  - Tokenization
  - 3D Secure authentication (if required)
  - Payment processing

### 4. 3D Secure Authentication (SCA)

- Automatically triggered for cards requiring authentication
- Uses `redirect: 'if_required'` to handle inline
- Mobile-friendly authentication flow
- Returns to app after completion

### 5. Payment Confirmation

```typescript
// After successful payment on client
confirmStripePayment({
  appointmentId: "apt_123",
  stripePaymentIntentId: "pi_xxx"
})

// Server verifies with Stripe and saves to database
// Creates audit log entry
```

## Mobile Optimization

### iOS Safari

- Font size 16px to prevent zoom on input focus
- Touch targets 44x44px minimum
- QuickType bar shows autofill suggestions
- Card field auto-advances on completion
- 3D Secure works inline (no popup blockers)

### Android Chrome

- Touch targets 48x48dp minimum
- Number keyboard for card input
- Chrome autofill integration
- Google Pay support (if configured)
- Network error handling

## Security Features

### PCI Compliance

- ✅ Card numbers never touch our servers
- ✅ Only Stripe.js handles card data
- ✅ Payment Intent client secret used client-side
- ✅ Only Payment Intent ID stored in database
- ✅ HTTPS enforced for all requests

### 3D Secure (SCA)

- Automatic detection for cards requiring authentication
- Inline authentication (no redirects on mobile)
- Fallback to redirect if inline fails
- Proper error handling for failed authentication

### Audit Logging

Every payment action is logged:
- Payment Intent creation
- Payment source selection
- Payment attempt
- Authentication requirement
- Payment success/failure
- Server confirmation

## Test Cards

### Successful Payments

| Card | Number |
|------|--------|
| Visa | `4242424242424242` |
| Mastercard | `5555555555554444` |
| Amex | `378282246310005` |

### 3D Secure Required

| Card | Number |
|------|--------|
| 3DS Always | `4000002500003155` |
| 3DS Optional | `4000002760003184` |

### Declined Cards

| Card | Number | Reason |
|------|--------|--------|
| Generic Decline | `4000000000000002` | Generic |
| Insufficient Funds | `4000000000009995` | No balance |

## API Reference

### Create Payment Intent

**Endpoint:** `POST /api/payments/create-intent`

**Request:**
```json
{
  "appointmentId": "string",
  "amount": number
}
```

**Response:**
```json
{
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

### Confirm Payment

**Server Action:** `confirmStripePayment()`

**Parameters:**
```typescript
{
  appointmentId: string
  stripePaymentIntentId: string
}
```

**Returns:**
```typescript
{
  success: boolean
  data?: {
    paymentId: string
    amount: number
  }
  error?: string
}
```

## Error Handling

### Network Errors

- Retry logic built into Stripe.js
- Clear error messages displayed
- Offline detection and user notification
- Graceful degradation on slow networks

### Payment Failures

- Card declined → Show specific error message
- Insufficient funds → Suggest alternative payment
- Authentication failed → Allow retry
- Network timeout → Retry option available

### Edge Cases

- Session expires during payment → Redirect to login
- Duplicate payment attempt → Detect and prevent
- Amount mismatch → Validate on server
- Invalid Payment Intent → Create new one

## Performance

### Optimization Techniques

1. **Lazy Loading**
   - Stripe.js loaded only when needed
   - Payment Elements initialized on demand

2. **Caching**
   - Stripe instance cached (singleton pattern)
   - Payment Intent reused if valid

3. **Mobile Performance**
   - Minimal JavaScript on initial load
   - Progressive enhancement
   - Network-aware loading states

### Metrics

- Payment Intent creation: < 500ms
- Stripe Elements render: < 1s
- Payment confirmation: < 2s (excluding 3D Secure)
- Total payment flow: < 10s (success case)

## Testing

### Automated Tests

```bash
# Run test suite
npx dotenv -e .env.local -- npx tsx scripts/test-stripe-payment-flow.ts
```

### Manual Testing

See [STRIPE_PAYMENT_TESTING.md](../testing/STRIPE_PAYMENT_TESTING.md) for complete testing guide.

**Key Test Scenarios:**
1. ✅ Successful payment with Visa
2. ✅ 3D Secure authentication
3. ✅ Card declined handling
4. ✅ Network error recovery
5. ✅ Mobile iOS Safari
6. ✅ Mobile Android Chrome
7. ✅ International cards
8. ✅ Slow network (3G)

## Known Limitations

1. **Raw Card API Disabled**
   - Cannot send raw card numbers to Stripe API
   - Must use Stripe Elements or tokens
   - This is a security feature (PCI compliance)

2. **Redirect on Some Cards**
   - Some banks require full-page redirect for 3D Secure
   - Handled gracefully with return URLs

3. **Browser Compatibility**
   - Modern browsers only (last 2 versions)
   - Progressive enhancement for older browsers
   - Fallback to simple card form if Elements fails

## Future Enhancements

### Planned Features

- [ ] Saved payment methods (customer portal)
- [ ] Apple Pay integration
- [ ] Google Pay integration
- [ ] Payment method selection UI
- [ ] Subscription payments (memberships)
- [ ] Refund UI for staff

### Webhooks Integration

- [ ] `payment_intent.succeeded` webhook
- [ ] `payment_intent.failed` webhook
- [ ] `charge.refunded` webhook
- [ ] Automatic payment status updates

## Resources

- [Stripe Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [Stripe Elements](https://stripe.com/docs/payments/elements)
- [3D Secure Guide](https://stripe.com/docs/payments/3d-secure)
- [Mobile Best Practices](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=elements#mobile-best-practices)
- [Test Cards](https://stripe.com/docs/testing#cards)

## Support

For issues or questions:
1. Check [STRIPE_PAYMENT_TESTING.md](../testing/STRIPE_PAYMENT_TESTING.md)
2. Review Stripe Dashboard for errors
3. Check browser console for client errors
4. Review audit logs for payment trail
5. Contact Stripe support for API issues
