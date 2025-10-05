# Mobile Testing Guide

## Overview
This guide provides step-by-step instructions for testing the SalonBase MVP on mobile devices to ensure >95% completion rate.

---

## Pre-Testing Setup

### Required Devices
- iPhone (iOS 15+): iPhone SE, iPhone 12/13/14
- Android (Chrome 100+): Pixel, Samsung Galaxy, OnePlus
- iPad (optional): iPad Mini or iPad Air

### Required Tools
1. **Chrome DevTools** - For desktop simulation and throttling
2. **BrowserStack/Sauce Labs** (optional) - For real device testing
3. **Lighthouse** - For performance audits
4. **Network Link Conditioner** (macOS) - For simulating slow networks

---

## Testing Scenarios

### Scenario 1: Happy Path - Complete Booking Flow

#### iOS Safari Testing
1. Open Safari on iPhone
2. Navigate to booking widget: `https://[your-domain]/book/[salon-slug]`
3. **Service Selection**:
   - [ ] Verify all service cards are readable
   - [ ] Tap on a service - ensure 44x44px touch target works
   - [ ] Verify smooth transition to next step
4. **Staff Selection**:
   - [ ] Verify staff list displays correctly
   - [ ] Tap "No Preference" option
   - [ ] Verify back button works
5. **Date/Time Selection**:
   - [ ] Scroll through dates horizontally (should be smooth)
   - [ ] Select today or tomorrow
   - [ ] Verify time slots load (skeleton should appear first)
   - [ ] Tap a time slot
   - [ ] Verify selection visual feedback
6. **Client Information**:
   - [ ] Tap on name field - keyboard should not zoom the page (16px font prevents this)
   - [ ] Test autofill: Start typing name, verify autocomplete suggestion appears
   - [ ] Test autofill: Start typing email, verify autocomplete works
   - [ ] Test autofill: Start typing phone, verify autocomplete works
   - [ ] Try submitting with empty fields - verify validation errors
   - [ ] Fill all required fields correctly
   - [ ] Tap "Confirm Booking" button
   - [ ] Verify loading state (spinner appears, button disabled)
7. **Confirmation**:
   - [ ] Verify confirmation screen appears
   - [ ] Verify booking details are correct
   - [ ] Check for confirmation email (if email provided)

**Expected Result**: 100% completion with no errors

#### Android Chrome Testing
Repeat the same steps as iOS Safari testing. Additionally:
- [ ] Verify autofill works with Google account
- [ ] Test back button behavior
- [ ] Verify no visual glitches or layout shifts

**Expected Result**: 100% completion with no errors

---

### Scenario 2: Interrupted Booking Flow (LocalStorage Persistence)

1. Open booking widget on mobile
2. Select service and staff
3. Select date and time
4. **Close the browser tab** (don't submit)
5. Reopen the booking widget
6. **Verify**:
   - [ ] Service selection is restored
   - [ ] Staff selection is restored
   - [ ] Date/time selection is restored
   - [ ] Can continue from where left off
7. Complete the booking
8. Verify localStorage is cleared after confirmation

**Expected Result**: Seamless recovery from interruption

---

### Scenario 3: Offline Behavior

1. Open booking widget while online
2. Select service and staff
3. **Turn off WiFi and mobile data**
4. Try to proceed to next step
5. **Verify**:
   - [ ] Yellow offline banner appears at top
   - [ ] Error message is user-friendly (not technical)
   - [ ] Button states are appropriate (disabled or showing retry)
6. **Turn WiFi back on**
7. **Verify**:
   - [ ] Offline banner disappears
   - [ ] Can proceed with booking
   - [ ] Data is not lost

**Expected Result**: Graceful offline handling with recovery

---

### Scenario 4: Slow Network (3G Simulation)

**Chrome DevTools Setup**:
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Enable "Disable cache"

**Test Steps**:
1. Start booking flow
2. **Verify loading states**:
   - [ ] Skeleton loaders appear (not just spinners)
   - [ ] Loading states are smooth (no flash of content)
   - [ ] Buttons are disabled during loading
3. Wait for each step to load
4. **Verify**:
   - [ ] No timeout errors (within reasonable time)
   - [ ] No layout shifts when content loads
   - [ ] Error messages if timeout occurs are helpful

**Expected Result**: Booking completes successfully within 60 seconds

---

### Scenario 5: Form Validation & Error Handling

1. Navigate to client information step
2. **Test each validation rule**:
   - [ ] Submit with empty name → Error appears
   - [ ] Submit with invalid email → Error appears
   - [ ] Submit with invalid phone → Error appears
   - [ ] Submit with no contact method → Error appears
3. **Verify error display**:
   - [ ] Error messages are clear and specific
   - [ ] Error messages appear near relevant fields
   - [ ] Error color/styling is visible on mobile
   - [ ] Can correct errors and resubmit
4. Fill form correctly and submit
5. **Simulate network error during submission**:
   - [ ] Turn off network just before submitting
   - [ ] Verify error message appears
   - [ ] Verify can retry after network restored

**Expected Result**: All validation works, errors are clear

---

### Scenario 6: Touch Target Testing

Use a tool to measure touch target sizes:
1. **Inspect all interactive elements**:
   - [ ] Service selection buttons ≥ 44x44px
   - [ ] Staff selection buttons ≥ 44x44px
   - [ ] Date buttons ≥ 44x44px (width: 80px)
   - [ ] Time slot buttons ≥ 44x44px
   - [ ] Form inputs ≥ 44px height
   - [ ] Submit buttons ≥ 44px height
   - [ ] Back buttons ≥ 44x44px

2. **Test with finger (not stylus)**:
   - [ ] Can tap each button accurately
   - [ ] No accidental taps on nearby elements
   - [ ] Buttons have adequate spacing

**Expected Result**: All touch targets meet WCAG 2.1 Level AAA (44x44px minimum)

---

### Scenario 7: Viewport Responsiveness

Test on different screen sizes:

#### iPhone SE (320px width)
- [ ] All content is visible (no horizontal scroll)
- [ ] Text is readable without zooming
- [ ] Buttons are not cut off
- [ ] Form inputs are full width
- [ ] Date scroll works smoothly

#### Standard Phone (375-414px width)
- [ ] Layout looks balanced
- [ ] Grid layouts work correctly (3 columns for time slots)
- [ ] All spacing looks appropriate

#### Tablet (768px width)
- [ ] Layout adapts to wider screen
- [ ] Grid shows 4 columns for time slots (sm:grid-cols-4)
- [ ] Padding increases (sm:p-6)

**Expected Result**: Responsive design works at all breakpoints

---

### Scenario 8: Keyboard & Autofill Behavior

1. **Test keyboard appearance**:
   - [ ] Name field: Standard keyboard appears
   - [ ] Email field: Email keyboard appears (@, .com shortcuts)
   - [ ] Phone field: Numeric keyboard appears
   - [ ] Keyboard does not zoom page (font-size: 16px prevents this)

2. **Test autofill**:
   - [ ] iOS: Tap autofill suggestion above keyboard
   - [ ] Android: Tap autofill dropdown from Google
   - [ ] Verify all fields populate correctly
   - [ ] Verify can still edit autofilled values

**Expected Result**: Keyboard types are correct, autofill works seamlessly

---

### Scenario 9: Multi-Appointment Booking

1. Complete one booking successfully
2. Without closing browser, book another appointment
3. **Verify**:
   - [ ] Can start new booking
   - [ ] Previous booking data doesn't interfere
   - [ ] LocalStorage is managed correctly
   - [ ] Confirmation shows correct details

**Expected Result**: Multiple bookings in one session work correctly

---

### Scenario 10: Accessibility Testing

1. **VoiceOver (iOS) / TalkBack (Android)**:
   - [ ] Enable screen reader
   - [ ] Navigate through booking flow
   - [ ] Verify all buttons have labels
   - [ ] Verify form inputs have labels
   - [ ] Verify error messages are announced

2. **Color Contrast**:
   - [ ] Use Chrome DevTools Accessibility panel
   - [ ] Verify all text meets WCAG AA contrast (4.5:1)
   - [ ] Verify error states are distinguishable

3. **Focus States**:
   - [ ] Verify focus ring is visible on all interactive elements
   - [ ] Verify focus order is logical

**Expected Result**: Booking is fully accessible

---

## Performance Testing

### Lighthouse Mobile Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Mobile" device
4. Select "Performance" category
5. Run audit

**Target Scores**:
- [ ] Performance: ≥ 90
- [ ] Accessibility: ≥ 95
- [ ] Best Practices: ≥ 90
- [ ] SEO: ≥ 85

### Core Web Vitals

**Targets**:
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] First Input Delay (FID): < 100ms
- [ ] Cumulative Layout Shift (CLS): < 0.1

### Load Time Testing

1. Clear browser cache
2. Enable "Slow 3G" throttling
3. Load booking widget
4. **Measure**:
   - [ ] Time to First Byte (TTFB): < 600ms
   - [ ] Time to Interactive (TTI): < 5s
   - [ ] Total page load: < 10s on 3G

---

## Payment Form Testing (When Implemented)

### Stripe Elements Mobile Testing

1. Proceed through booking to payment step
2. **Verify Stripe Elements**:
   - [ ] Card element loads successfully
   - [ ] Font size is 16px (prevents iOS zoom)
   - [ ] Touch target height is 44px
   - [ ] Card element styling matches app
3. **Test card input**:
   - [ ] Enter test card: `4242 4242 4242 4242`
   - [ ] Verify real-time validation
   - [ ] Test expiry date field
   - [ ] Test CVC field
   - [ ] Test postal code field
4. **Test error handling**:
   - [ ] Enter invalid card number → Error appears
   - [ ] Enter expired date → Error appears
   - [ ] Verify error messages are mobile-friendly
5. **Test payment submission**:
   - [ ] Tap pay button
   - [ ] Verify loading state (button disabled, spinner shows)
   - [ ] Verify payment completes
   - [ ] Verify confirmation appears

### Stripe Elements Failure Fallback

1. Block Stripe Elements from loading (DevTools)
2. Reload payment page
3. **Verify**:
   - [ ] Fallback message appears
   - [ ] Message is clear and helpful
   - [ ] Can go back or contact support
   - [ ] No blank page or crash

**Expected Result**: Payment works on mobile, fallback handles failures

---

## Completion Rate Tracking

### Metrics to Track

**Setup Google Analytics or Posthog**:
1. Track events:
   - `booking_started`: When service is selected
   - `booking_staff_selected`: Staff selection completed
   - `booking_datetime_selected`: Date/time selected
   - `booking_info_submitted`: Client info submitted
   - `booking_confirmed`: Booking successful
   - `booking_error`: Any error occurred

2. **Calculate completion rate**:
   ```
   Completion Rate = (booking_confirmed / booking_started) * 100
   ```

3. **Target**: ≥ 95%

### Drop-off Analysis

If completion rate < 95%, identify drop-off points:
- [ ] Service selection → Staff (expected: 5% drop-off)
- [ ] Staff → Date/time (expected: 5% drop-off)
- [ ] Date/time → Client info (expected: 10% drop-off)
- [ ] Client info → Confirmed (expected: 5% drop-off)

**Investigation**: If drop-off > expected at any step, investigate:
- Network errors in console
- Validation issues
- UI/UX confusion
- Performance problems

---

## Bug Reporting Template

When reporting mobile issues, include:

```markdown
**Device**: [iPhone 12, iOS 15.6]
**Browser**: [Safari 15.6]
**Network**: [WiFi / 4G / 3G]
**Scenario**: [Complete booking flow]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Video**:
[Attach if possible]

**Console Errors**:
[Any errors from browser console]

**Severity**: [Critical / High / Medium / Low]
```

---

## Testing Checklist Summary

Before launch, verify:
- [  ] All 10 scenarios tested on iOS Safari
- [  ] All 10 scenarios tested on Android Chrome
- [ ] Lighthouse mobile score ≥ 90
- [ ] All touch targets ≥ 44x44px
- [ ] Autofill works on all forms
- [ ] Offline banner appears when offline
- [ ] Loading states use skeletons (not just spinners)
- [ ] LocalStorage persistence works
- [ ] Viewport responsive 320px - 768px
- [ ] Payment form mobile-optimized (when implemented)
- [ ] Completion rate ≥ 95% in beta testing

---

## Resources

- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/ios
- **Material Design**: https://material.io/design
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Stripe Mobile Best Practices**: https://stripe.com/docs/payments/mobile
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
