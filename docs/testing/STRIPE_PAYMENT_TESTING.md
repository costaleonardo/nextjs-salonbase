# Stripe Payment Flow Testing Guide

## Overview

This guide provides instructions for testing the Stripe payment integration across different devices and scenarios.

## Prerequisites

- Stripe account in test mode
- Test publishable and secret keys configured
- Mobile devices or emulators for iOS Safari and Android Chrome

## Test Cards

Use these Stripe test cards for different scenarios. **Note:** Use Stripe Elements in the UI to enter these - do not send raw card numbers to the API.

### US Cards (Should Succeed)

| Card Type | Number | Description |
|-----------|--------|-------------|
| Visa | `4242424242424242` | Basic US Visa card |
| Visa Debit | `4000056655665556` | US Visa debit card |
| Mastercard | `5555555555554444` | Basic US Mastercard |
| Mastercard Debit | `5200828282828210` | US Mastercard debit |
| Amex | `378282246310005` | American Express |
| Discover | `6011111111111117` | Discover card |

For all cards, use:
- Any future expiration date (e.g., 12/25)
- Any 3-digit CVC (4 digits for Amex)
- Any billing zip code

### 3D Secure / SCA Cards

| Card Number | Description |
|-------------|-------------|
| `4000002500003155` | Requires authentication (always) |
| `4000002760003184` | Supports authentication (optional) |
| `4000008260000000` | UK card with 3D Secure |

### Declined Cards (Should Fail)

| Card Number | Decline Reason |
|-------------|----------------|
| `4000000000000002` | Generic decline |
| `4000000000009995` | Insufficient funds |
| `4000000000009987` | Lost card |
| `4000000000009979` | Stolen card |

### International Cards

| Card Number | Country |
|-------------|---------|
| `4000000760000002` | Brazil |
| `4000004840000008` | Mexico |
| `4000008260000000` | United Kingdom |
| `4000000360000006` | Australia |
| `4000001240000000` | Canada |

## Testing Checklist

### ✅ Phase 1: Desktop Testing

- [ ] **Payment Intent Creation**
  - [ ] Navigate to payment page
  - [ ] Verify Payment Intent is created
  - [ ] Check client secret is returned
  - [ ] Verify loading state shows

- [ ] **Stripe Elements Rendering**
  - [ ] Card input displays correctly
  - [ ] Fields are properly styled
  - [ ] Tab navigation works
  - [ ] Field validation works (invalid card number, expired date)

- [ ] **Successful Payment**
  - [ ] Use `4242424242424242` (Visa)
  - [ ] Enter valid expiration and CVC
  - [ ] Click "Pay" button
  - [ ] Verify loading state
  - [ ] Confirm success message appears
  - [ ] Check payment is saved to database
  - [ ] Verify audit log entry created

- [ ] **Payment Failures**
  - [ ] Use `4000000000000002` (declined)
  - [ ] Verify error message displays
  - [ ] Check retry option is available
  - [ ] Confirm payment NOT saved to database
  - [ ] Verify failure logged in audit log

- [ ] **3D Secure Flow**
  - [ ] Use `4000002500003155` (requires auth)
  - [ ] Verify authentication modal appears
  - [ ] Complete authentication
  - [ ] Confirm payment succeeds after auth
  - [ ] Check payment saved correctly

### ✅ Phase 2: iOS Safari Testing

- [ ] **Device Requirements**
  - [ ] iPhone (iOS 15+) or iPad
  - [ ] Safari browser (latest version)
  - [ ] Good network connection

- [ ] **Touch Targets**
  - [ ] All buttons minimum 44x44px
  - [ ] Card input fields easy to tap
  - [ ] No accidental taps

- [ ] **Keyboard Behavior**
  - [ ] Number keyboard for card number
  - [ ] Auto-advance between fields works
  - [ ] Done button closes keyboard
  - [ ] No zoom on input focus (font-size >= 16px)

- [ ] **Autofill**
  - [ ] Safari autofill works for card
  - [ ] Saved cards appear if available
  - [ ] QuickType bar shows suggestions

- [ ] **Payment Flow**
  - [ ] Complete payment with Visa (`4242424242424242`)
  - [ ] Test 3D Secure (`4000002500003155`)
  - [ ] Verify redirect works properly
  - [ ] Test payment failure handling
  - [ ] Verify network error handling

- [ ] **3D Secure Redirect**
  - [ ] Authentication page loads in same tab
  - [ ] Can complete authentication
  - [ ] Returns to app after auth
  - [ ] Payment completes successfully

### ✅ Phase 3: Android Chrome Testing

- [ ] **Device Requirements**
  - [ ] Android device (Android 10+)
  - [ ] Chrome browser (latest version)
  - [ ] Good network connection

- [ ] **Touch Targets**
  - [ ] All buttons minimum 48x48dp
  - [ ] Fields easy to tap
  - [ ] No mis-taps

- [ ] **Keyboard Behavior**
  - [ ] Number keyboard for card number
  - [ ] Auto-advance works
  - [ ] Done/Go button visible
  - [ ] No viewport zoom issues

- [ ] **Autofill**
  - [ ] Chrome autofill works
  - [ ] Google Pay appears if configured
  - [ ] Saved cards work

- [ ] **Payment Flow**
  - [ ] Complete payment with Visa
  - [ ] Test 3D Secure flow
  - [ ] Test failure handling
  - [ ] Verify success flow

### ✅ Phase 4: Network Conditions

Test with simulated slow networks (Chrome DevTools Network Throttling or Xcode Network Link Conditioner):

- [ ] **3G Network (750Kbps)**
  - [ ] Payment Intent loads
  - [ ] Stripe Elements loads
  - [ ] Payment processes successfully
  - [ ] Loading indicators show

- [ ] **Offline → Online**
  - [ ] Start offline
  - [ ] Attempt payment (should show error)
  - [ ] Go online
  - [ ] Retry payment (should succeed)

- [ ] **Slow 4G (4Mbps)**
  - [ ] Complete full payment flow
  - [ ] Verify no timeout errors
  - [ ] Check user experience is acceptable

### ✅ Phase 5: Edge Cases

- [ ] **Card Validation**
  - [ ] Invalid card number shows error
  - [ ] Expired card shows error
  - [ ] Invalid CVC shows error
  - [ ] Missing fields show errors

- [ ] **Amount Edge Cases**
  - [ ] Minimum amount ($0.50)
  - [ ] Decimal amounts ($10.99)
  - [ ] Large amounts ($1,000+)

- [ ] **Session Handling**
  - [ ] Payment works when logged in
  - [ ] Session expires during payment
  - [ ] Multiple browser tabs

- [ ] **Browser Back Button**
  - [ ] Press back during payment
  - [ ] Verify state is preserved
  - [ ] Can resume payment

### ✅ Phase 6: Security & Compliance

- [ ] **Data Security**
  - [ ] Card numbers never sent to our server
  - [ ] Only client secret used client-side
  - [ ] Payment Intent ID stored, not card data
  - [ ] Audit log records all actions

- [ ] **PCI Compliance**
  - [ ] Stripe Elements handles card input
  - [ ] No card data in localStorage
  - [ ] No card data in browser DevTools
  - [ ] HTTPS enforced

## Test Scenarios

### Scenario 1: First-time Payment (Mobile)

1. Open booking widget on mobile
2. Select service and time
3. Enter client information
4. Proceed to payment
5. Select "Credit Card" as payment method
6. Enter Visa test card: `4242424242424242`
7. Enter expiration: `12/25`
8. Enter CVC: `123`
9. Tap "Pay $X.XX" button
10. Verify success message
11. Check appointment is confirmed

**Expected Result:** Payment succeeds, appointment created, receipt sent

### Scenario 2: 3D Secure Authentication (iOS Safari)

1. Open payment page on iPhone
2. Select credit card payment
3. Enter test card: `4000002500003155`
4. Enter expiration and CVC
5. Tap Pay button
6. Authentication modal appears
7. Complete authentication
8. Return to app
9. Verify payment success

**Expected Result:** Authentication completes, payment succeeds

### Scenario 3: Payment Failure & Retry (Android)

1. Open payment on Android
2. Enter declined card: `4000000000000002`
3. Tap Pay
4. See error message
5. Tap "Try Again"
6. Enter valid card: `4242424242424242`
7. Complete payment

**Expected Result:** First payment fails gracefully, retry succeeds

### Scenario 4: Slow Network (3G)

1. Enable 3G simulation
2. Open payment page
3. Verify loading indicators show
4. Complete payment with Visa
5. Wait for confirmation

**Expected Result:** Payment succeeds despite slow network

## Automated Testing

Run the automated test suite:

```bash
# Test Payment Intent creation
npx dotenv -e .env.local -- npx tsx scripts/test-stripe-payment-flow.ts

# Run E2E tests (when Playwright/Cypress is set up)
npm run test:e2e -- stripe-payment
```

## Success Criteria

✅ **Must Pass (Launch Blockers):**

1. Payment succeeds on iOS Safari
2. Payment succeeds on Android Chrome
3. 3D Secure authentication works on mobile
4. Declined cards show clear error messages
5. Network errors are handled gracefully
6. Touch targets meet mobile standards (44x44px)
7. No accidental credit card charges (gift cert priority enforced)
8. All payments logged to audit trail
9. Zero payment processing errors in testing

✅ **Should Pass (High Priority):**

1. Autofill works on mobile browsers
2. International cards process successfully
3. Refunds complete successfully
4. Retry logic works correctly (max 2 attempts)

## Debugging

### Common Issues

**Issue: "Payment Intent creation failed"**
- Check Stripe API keys are set
- Verify network connectivity
- Check Stripe Dashboard for errors

**Issue: "3D Secure not working on mobile"**
- Verify `allow_redirects: 'never'` is set
- Check return URL is configured
- Test with different browsers

**Issue: "Touch targets too small"**
- Verify CSS has `min-h-[44px]` on buttons
- Check `touch-manipulation` CSS is applied
- Test on actual device, not just emulator

### Useful Commands

```bash
# Check Stripe test mode
echo $STRIPE_SECRET_KEY | grep test

# View recent Payment Intents
npx stripe payment_intents list --limit 10

# View webhook events
npx stripe events list --limit 10

# Test webhook locally
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Reference

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Stripe Elements Docs](https://stripe.com/docs/payments/elements)
- [3D Secure Docs](https://stripe.com/docs/payments/3d-secure)
- [Mobile Best Practices](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=elements#mobile-best-practices)
