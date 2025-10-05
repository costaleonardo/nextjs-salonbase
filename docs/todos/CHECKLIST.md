# SalonBase MVP Development Checklist

**Target Timeline:** 8 weeks (January 2026 Launch)
**Last Updated:** October 2, 2025

---

## Phase 1: Core Foundation (Weeks 1-2)

### Project Setup & Infrastructure
- [x] Initialize Next.js 15 project with App Router
- [x] Configure TypeScript with strict mode
- [x] Set up ESLint and Prettier
- [x] Configure Git workflow (main branch, feature branches)
- [x] Set up environment variables structure (.env.local, .env.example)
- [x] Create project folder structure (/app, /lib, /components, /prisma)
- [x] Set up Vercel deployment pipeline

### Database Setup (Neon PostgreSQL)
- [x] Create Neon account and project
- [x] Provision production database (Pro plan - $19/month)
- [x] Provision development database (Free tier or branch)
- [x] Set up environment variables (DATABASE_URL_POOLED, DATABASE_URL_DIRECT)
- [x] Configure SSL/TLS connections
- [ ] Set up IP allowlisting for production
- [x] Test connection pooling configuration
- [ ] Configure point-in-time recovery (7 days)
- [ ] Set up database branching workflow

### Prisma ORM Setup
- [x] Install Prisma dependencies (@prisma/client, @neondatabase/serverless, @prisma/adapter-neon)
- [x] Create prisma/schema.prisma with datasource configuration
- [x] Implement lib/db.ts with Neon adapter and connection pooling
- [x] Configure Prisma logging (development vs production)
- [x] Set up migration scripts in package.json

### Database Schema - Core Models
- [x] Create User model (id, email, role, salonId, timestamps)
- [x] Add User indexes (salonId, email)
- [x] Create Role enum (OWNER, STAFF, CLIENT)
- [x] Create Salon model (id, name, settings, timestamps)
- [x] Create Client model (id, salonId, name, email, phone, notes)
- [x] Add Client indexes (salonId, email, phone)
- [x] Create Service model (id, salonId, name, duration, price, staffIds)
- [x] Add Service indexes (salonId)
- [x] Create AppointmentStatus enum (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- [x] Create Appointment model (id, clientId, staffId, serviceId, datetime, status)
- [x] Add Appointment indexes (datetime, staffId+datetime, clientId)
- [x] Run initial migration: `prisma migrate dev --name init`
- [x] Test schema with basic queries

### Authentication (NextAuth.js)
- [x] Install next-auth and dependencies
- [x] Create /app/api/auth/[...nextauth]/route.ts
- [x] Configure email/password authentication provider
- [x] Set up JWT session strategy
- [x] Create login page (/app/login)
- [x] Create signup page (/app/signup)
- [x] Implement role-based authorization middleware
- [x] Create protected route wrapper for dashboard
- [x] Test authentication flow (signup, login, logout)
- [x] Add password hashing with bcrypt
- [x] Configure session persistence

### Basic Appointment Management
- [x] Create Appointment Server Actions (/app/actions/appointments.ts)
  - [x] createAppointment action
  - [x] updateAppointment action
  - [x] cancelAppointment action
  - [x] getAppointments action (with date filtering)
- [x] Implement conflict detection logic (same staff, overlapping times)
- [x] Create appointment validation rules
- [x] Add error handling and rollback for failed operations

### Staff Dashboard Layout
- [x] Create dashboard layout component (/app/dashboard/layout.tsx)
- [x] Implement navigation menu (Appointments, Clients, Services, Payments)
- [x] Create responsive sidebar for desktop
- [x] Add user profile dropdown with logout
- [x] Create mobile navigation menu
- [x] Add breadcrumb navigation
- [x] Test accessibility (WCAG 2.1 AA)

### Dashboard - Appointments View
- [x] Create /app/dashboard/appointments page
- [x] Implement daily calendar view component
- [x] Implement weekly calendar view component
- [x] Add view toggle (day/week)
- [x] Create appointment card component
- [x] Add "Create Appointment" button (< 3 clicks requirement)
- [x] Create appointment creation modal/form
- [x] Implement appointment edit modal
- [x] Add appointment cancellation with confirmation
- [x] Show conflict warnings in real-time
- [x] Display service name, duration, and price
- [x] Test calendar navigation (previous/next day/week)

---

## Phase 2: Payment System (Weeks 3-4)

### Stripe Integration Setup
- [x] Create Stripe account (test mode)
- [x] Install stripe and @stripe/stripe-js packages
- [x] Set up Stripe API keys in environment variables
- [x] Create lib/stripe.ts with Stripe client initialization
- [x] Configure webhook endpoint secret
- [x] Test Stripe connection in development

### Payment Schema
- [x] Create PaymentMethod enum (CREDIT_CARD, GIFT_CERTIFICATE, CASH, OTHER)
- [x] Create PaymentStatus enum (PENDING, COMPLETED, FAILED, REFUNDED)
- [x] Create Payment model (id, appointmentId, amount, method, stripePaymentId, status, createdAt)
- [x] Add Payment to Appointment relation (one-to-one)
- [x] Add Payment indexes (stripePaymentId)
- [x] Create PaymentAuditLog model (id, paymentId, action, details JSON, createdAt)
- [x] Add PaymentAuditLog indexes (paymentId, createdAt)
- [x] Run migration: `prisma migrate dev --name add_payments`

### Gift Certificate System
- [x] Create GiftCertificate model (id, code, balance, originalAmount, salonId, clientId, createdAt, expiresAt)
- [x] Add GiftCertificate indexes (code, salonId)
- [x] Run migration: `prisma migrate dev --name add_gift_certificates`
- [x] Create gift certificate generation logic (unique code generator)
- [x] Implement gift certificate validation
- [x] Create checkGiftCertificateBalance server action
- [x] Create redeemGiftCertificate server action
- [x] Add gift certificate balance tracking
- [x] Implement expiration date handling
- [x] Test certificate deduplication

### Payment Processing - CRITICAL IMPLEMENTATION
- [x] Create payment source selection component with EXPLICIT UI
  - [x] Radio buttons for payment source (Gift Certificate, Credit Card, Cash, Other)
  - [x] Show gift certificate balance prominently
  - [x] Show last 4 digits of saved cards
  - [x] Add "New Payment Method" option
- [x] Implement payment source hierarchy logic:
  1. [x] Check for available gift certificates FIRST
  2. [x] Show explicit payment source selection
  3. [x] Require confirmation for credit card charges
  4. [x] Log every payment decision to PaymentAuditLog
- [x] Create processPayment server action with audit trail
- [x] Implement automatic rollback on payment failures
- [x] Add payment retry logic (max 2 attempts)
- [x] Create payment confirmation modal
- [x] Show clear payment status (pending, success, failed)
- [x] Test payment failure scenarios
- [x] Test gift certificate application before credit card
- [x] **Verify gift certificates NEVER accidentally charge credit cards**

### Stripe Payment Flow
- [x] Create Stripe Payment Intent creation endpoint
- [x] Implement Stripe Elements for card input (mobile-optimized)
- [x] Create payment confirmation UI
- [x] Handle 3D Secure authentication (SCA)
- [x] Implement payment success callback
- [x] Implement payment failure handling
- [x] Test on iOS Safari
- [x] Test on Android Chrome
- [x] Test with various card types (US, international)

### Stripe Webhooks
- [x] Create /app/api/webhooks/stripe route
- [x] Implement webhook signature verification
- [x] Handle payment_intent.succeeded event
- [x] Handle payment_intent.failed event
- [x] Handle charge.refunded event
- [x] Update Payment status in database
- [x] Create audit log entries for webhook events
- [x] Test webhook handling with Stripe CLI
- [ ] Set up webhook endpoint in Stripe dashboard

### Payment Audit Logging
- [x] Create audit logging utility function
- [x] Log payment source selection
- [x] Log payment attempt (method, amount, timestamp)
- [x] Log payment success/failure
- [x] Log gift certificate application
- [x] Log refunds and voids
- [x] Create audit log viewing page for admins
- [x] Test audit trail completeness

### Receipt Generation
- [x] Design receipt email template
- [ ] Create receipt PDF generator (optional)
- [x] Implement receipt data formatting
- [x] Create sendReceipt server action
- [x] Integrate with email service (see Phase 3)
- [ ] Test receipt delivery
- [x] Add receipt resend functionality
- [x] Store receipt metadata in Payment model

---

## Phase 3: Client Features (Weeks 5-6)

### Email/SMS Notification Setup
- [x] Choose email provider (Resend, SendGrid, or similar)
- [x] Set up email provider account and API keys
- [x] Install email provider SDK
- [x] Create lib/email.ts with email client
- [x] Choose SMS provider (Twilio recommended)
- [x] Set up SMS provider account and API keys
- [x] Install SMS provider SDK
- [x] Create lib/sms.ts with SMS client
- [x] Create notification templates folder

### Notification System
- [x] Create Notification model (id, type, recipient, status, scheduledAt, sentAt)
- [x] Create notification queue system (Inngest integration)
- [x] Install @inngest/sdk
- [ ] Set up Inngest account
- [x] Create /app/api/inngest route
- [x] Create appointment confirmation email template
- [x] Create appointment reminder email template (24hr before)
- [x] Create appointment confirmation SMS template
- [x] Create appointment reminder SMS template
- [x] Implement sendAppointmentConfirmation function
- [x] Implement sendAppointmentReminder function
- [x] Create notification scheduling logic
- [ ] Test email deliverability
- [ ] Test SMS delivery
- [x] Add unsubscribe mechanism

### Client Management Dashboard
- [x] Create /app/dashboard/clients page
- [x] Implement client list view with search
- [x] Add client filtering (by name, email, phone)
- [x] Create client detail view
- [x] Show client appointment history
- [x] Calculate and display total spend
- [x] Show client visit frequency
- [x] Add client notes section (staff-only)
- [x] Create "Add Client" form
- [x] Create "Edit Client" form
- [x] Test client search performance

### Public Booking Widget
- [x] Create /app/book/[salonSlug] public route
- [x] Design mobile-first booking UI
- [x] Create service selection step
- [x] Create staff selection step (or auto-assign)
- [x] Create date/time selection calendar
- [x] Show real-time availability
- [x] Implement conflict checking for public bookings
- [x] Create client information form
- [x] Add form validation
- [x] Implement progress saving (localStorage)
- [x] Create booking confirmation page
- [x] Test on iOS Safari
- [x] Test on Android Chrome
- [x] Test booking widget embedding (iframe support)

### Mobile Optimization
- [ ] Test all forms on mobile devices (iOS/Android)
- [ ] Optimize touch targets (min 44x44px)
- [ ] Test payment forms on mobile
- [ ] Implement autofill support for contact forms
- [ ] Add loading states for all async actions
- [ ] Test offline behavior and error messages
- [ ] Optimize images for mobile (Next.js Image component)
- [ ] Test viewport responsiveness (320px - 768px)
- [ ] Verify mobile booking completion rate target (>95%)
- [ ] Add fallback to simple card form if Stripe Elements fails

### Membership System
- [ ] Create Membership model (id, clientId, salonId, tier, status, startDate, endDate, stripeSubscriptionId)
- [ ] Create MembershipTier model (id, salonId, name, price, benefits JSON)
- [ ] Run migration: `prisma migrate dev --name add_memberships`
- [ ] Create membership signup flow
- [ ] Implement Stripe subscription creation
- [ ] Handle recurring billing webhooks (subscription events)
- [ ] Create membership cancellation flow
- [ ] Add membership status to client profile
- [ ] Show membership benefits on booking page
- [ ] Test mobile membership signup (iOS/Android)
- [ ] Implement progress saving for interrupted signups
- [ ] Add retry logic (max 2 attempts)
- [ ] Test subscription lifecycle (create, renew, cancel)

### Client Portal
- [ ] Create /app/portal route (client authentication)
- [ ] Implement client login (email/OTP or password)
- [ ] Create client dashboard view
- [ ] Show upcoming appointments
- [ ] Show past appointments
- [ ] Display membership status (if applicable)
- [ ] Show gift certificate balance
- [ ] Add appointment cancellation (with policy)
- [ ] Add appointment rescheduling
- [ ] Test client portal on mobile

---

## Phase 4: Migration & Polish (Weeks 7-8)

### Data Import System
- [ ] Create /app/dashboard/import page (owner-only)
- [ ] Design CSV/Excel upload UI
- [ ] Create file parser (support CSV, XLSX)
- [ ] Implement data validation rules
  - [ ] Required fields check
  - [ ] Email format validation
  - [ ] Phone format validation
  - [ ] Date format validation
- [ ] Create data preview component (table view)
- [ ] Implement client deduplication logic (match by email/phone)
- [ ] Create import confirmation step
- [ ] Implement database transaction for import
  - [ ] Begin transaction
  - [ ] Insert clients
  - [ ] Insert services
  - [ ] Insert appointment history
  - [ ] Commit or rollback on error
- [ ] Add progress indicator during import
- [ ] Create import success summary
- [ ] Implement rollback option (undo import)
- [ ] Create import error report
- [ ] Test with sample Fresha export data
- [ ] Test large dataset import (1000+ records)
- [ ] Verify 100% data integrity

### Service Management
- [ ] Create /app/dashboard/services page
- [ ] Implement service list view
- [ ] Create "Add Service" form
- [ ] Create "Edit Service" form
- [ ] Add service duration and price fields
- [ ] Implement staff assignment to services
- [ ] Add service archive/deletion
- [ ] Create service category organization (optional)
- [ ] Test service CRUD operations

### Staff Management
- [ ] Create /app/dashboard/staff page (owner-only)
- [ ] Implement staff list view
- [ ] Create "Add Staff" form
- [ ] Create "Edit Staff" form
- [ ] Implement role assignment (OWNER, STAFF)
- [ ] Add staff schedule/blocked times
- [ ] Create staff deactivation (soft delete)
- [ ] Test staff permissions

### Blocked Times & Availability
- [ ] Create BlockedTime model (id, staffId, startTime, endTime, reason, recurring)
- [ ] Run migration: `prisma migrate dev --name add_blocked_times`
- [ ] Create blocked time management UI
- [ ] Implement recurring blocked times (lunch breaks)
- [ ] Update conflict detection to account for blocked times
- [ ] Test availability calculation

### Database Performance Tuning
- [ ] Analyze query performance with Prisma query logs
- [ ] Add missing indexes (identified from slow queries)
- [ ] Optimize appointment queries with includes
- [ ] Implement pagination for large lists (50 items/page)
- [ ] Add database query caching with Upstash Redis
- [ ] Configure Upstash Redis account (free tier)
- [ ] Implement cache invalidation strategy
- [ ] Test p95 query response time (<100ms target)
- [ ] Monitor connection pool usage
- [ ] Review and optimize N+1 queries

### Redis Caching Setup (Upstash)
- [ ] Create Upstash account
- [ ] Provision Redis database
- [ ] Install @upstash/redis package
- [ ] Create lib/redis.ts
- [ ] Implement cache utility functions (get, set, invalidate)
- [ ] Cache frequently accessed data (services, staff availability)
- [ ] Set appropriate TTL values
- [ ] Test cache performance improvement

### Error Handling & Monitoring
- [ ] Set up Sentry account (Team plan - $26/month)
- [ ] Install @sentry/nextjs
- [ ] Configure Sentry in next.config.js
- [ ] Set up error boundaries in React components
- [ ] Add try-catch blocks to all server actions
- [ ] Implement user-friendly error messages
- [ ] Create error logging for payment failures
- [ ] Test error reporting to Sentry
- [ ] Set up Sentry alerts for critical errors
- [ ] Configure error rate threshold alerts

### Email Template Improvements
- [x] Create branded email templates (HTML + plain text)
- [ ] Add company logo and styling
- [x] Create appointment confirmation template
- [x] Create appointment reminder template
- [x] Create receipt email template
- [ ] Create welcome email for new clients
- [ ] Create password reset email
- [ ] Test email rendering across clients (Gmail, Outlook, Apple Mail)
- [ ] Add unsubscribe links

### UI/UX Polish
- [ ] Implement consistent loading states (skeletons)
- [ ] Add toast notifications for user actions
- [ ] Improve form validation messages
- [ ] Add keyboard shortcuts for common actions
- [ ] Implement dark mode (optional)
- [ ] Test color contrast for accessibility
- [ ] Add empty states for lists
- [ ] Create 404 and error pages
- [ ] Add favicon and meta tags
- [ ] Test all pages on multiple browsers

### Documentation
- [ ] Write user guide for salon owners
- [ ] Create staff training documentation
- [ ] Write data migration guide
- [ ] Document API endpoints (if any public APIs)
- [ ] Create troubleshooting guide
- [ ] Write video tutorials (screen recordings)
- [ ] Create FAQ page
- [ ] Document environment variable setup

---

## Testing & Quality Assurance

### Unit Testing
- [ ] Set up Jest and React Testing Library
- [ ] Write tests for payment logic (CRITICAL)
- [ ] Write tests for gift certificate validation
- [ ] Write tests for conflict detection
- [ ] Write tests for date/time calculations
- [ ] Write tests for data import validation
- [ ] Achieve >80% coverage for critical paths

### Integration Testing
- [ ] Test complete booking flow (public → payment → confirmation)
- [ ] Test payment processing with Stripe test cards
- [ ] Test gift certificate redemption flow
- [ ] Test appointment creation with conflicts
- [ ] Test data import with rollback
- [ ] Test webhook handling
- [ ] Test email/SMS delivery

### End-to-End Testing
- [ ] Set up Playwright or Cypress
- [ ] Test critical user journeys
  - [ ] Salon owner signup and setup
  - [ ] Staff creating an appointment
  - [ ] Client booking on mobile
  - [ ] Payment with gift certificate
  - [ ] Payment with credit card
  - [ ] Membership signup on mobile
  - [ ] Data import from CSV
- [ ] Test cross-browser (Chrome, Safari, Firefox)
- [ ] Test mobile devices (iOS, Android)

### Payment Testing - CRITICAL
- [ ] Test gift certificate shows BEFORE credit card option
- [ ] Test payment with insufficient gift certificate balance
- [ ] Test payment failure rollback
- [ ] Test double-charge prevention
- [ ] Test payment audit log completeness
- [ ] Test refund processing
- [ ] Test 3D Secure authentication
- [ ] Verify ZERO payment errors in testing (Launch requirement ✅)

### Mobile Testing
- [ ] Test booking widget on iPhone (Safari)
- [ ] Test booking widget on Android (Chrome)
- [ ] Test payment form on mobile (iOS)
- [ ] Test payment form on mobile (Android)
- [ ] Test membership signup on mobile (iOS)
- [ ] Test membership signup on mobile (Android)
- [ ] Verify >95% mobile completion rate (Launch requirement ✅)
- [ ] Test slow network conditions (3G)

### Performance Testing
- [ ] Test database response time under load
- [ ] Verify p95 < 100ms for key queries (Launch requirement ✅)
- [ ] Test concurrent appointment bookings
- [ ] Test large data import performance
- [ ] Run Lighthouse audits (target >90 performance score)
- [ ] Test Time to First Byte (TTFB)
- [ ] Monitor Core Web Vitals

### Security Testing
- [ ] Test authentication bypass attempts
- [ ] Test SQL injection vulnerabilities
- [ ] Test XSS vulnerabilities
- [ ] Verify HTTPS enforcement
- [ ] Test CSRF protection
- [ ] Verify API authentication
- [ ] Test role-based access control
- [ ] Audit payment data handling (PCI compliance)
- [ ] Test database connection security (SSL/TLS)
- [ ] Verify environment variables are not exposed

---

## Pre-Launch Checklist

### Infrastructure
- [ ] Production database provisioned (Neon Pro - $19/month)
- [ ] Database backups configured (point-in-time recovery)
- [ ] Vercel production deployment configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Environment variables set in production
- [ ] Stripe production mode enabled
- [ ] Webhook endpoints registered in production
- [ ] Sentry production project configured
- [ ] Upstash Redis production database active

### Security & Compliance
- [ ] All API endpoints authenticated
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] Database SSL/TLS enforced
- [ ] IP allowlisting configured for production DB
- [ ] PCI compliance checklist completed (Stripe)
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] GDPR compliance (if applicable)

### Performance
- [ ] Database indexes optimized
- [ ] Query performance verified (<100ms p95) ✅
- [ ] Caching strategy implemented
- [ ] Image optimization verified
- [ ] Bundle size optimized
- [ ] Lighthouse score >90
- [ ] Uptime monitoring configured (99.9% SLA target) ✅

### Payment System Verification - CRITICAL
- [ ] ✅ Zero payment processing errors in testing
- [ ] ✅ Gift certificates never charge wrong source
- [ ] Payment audit logs working correctly
- [ ] Receipt generation and delivery working
- [ ] Refund process tested
- [ ] Stripe webhook failover tested

### Data Import Verification
- [ ] ✅ Data import from CSV with rollback
- [ ] Sample Fresha data imports successfully
- [ ] Data validation catches all errors
- [ ] Deduplication working correctly
- [ ] Import progress tracking working
- [ ] Rollback functionality tested

### Mobile Verification
- [ ] ✅ Mobile booking works on iOS/Android
- [ ] ✅ 95% mobile completion rate achieved
- [ ] Touch targets appropriately sized
- [ ] Forms work with mobile keyboards
- [ ] Autofill supported
- [ ] Offline error handling graceful

### Documentation & Support
- [ ] User documentation complete
- [ ] Video tutorials recorded
- [ ] FAQ page live
- [ ] Support email configured
- [ ] Support response time process (<2 hour target)
- [ ] Onboarding email sequence ready

---

## Launch Strategy

### Week 1: Soft Launch (5 Beta Salons)
- [ ] Identify 5 beta salons from personal network
- [ ] Schedule onboarding calls
- [ ] Manually migrate data for beta users
- [ ] Set up daily check-in schedule
- [ ] Monitor database performance dashboard
- [ ] Document all issues in tracking system
- [ ] Deploy rapid bug fixes (same-day)
- [ ] Collect initial feedback

### Week 2-4: Controlled Growth (25 Salons)
- [ ] Open applications for early access
- [ ] Onboard 5 new salons per week
- [ ] Monitor database scaling (Neon autoscaling)
- [ ] Track migration success rate (target: 100%)
- [ ] Collect testimonials from successful migrations
- [ ] Create case studies
- [ ] Refine onboarding process based on feedback
- [ ] Monitor payment error rate (<0.1% target)

### Month 2: Public Launch
- [ ] Prepare ProductHunt launch materials
  - [ ] Screenshots and demo video
  - [ ] Launch post copy
  - [ ] Founder introduction
- [ ] Create direct outreach campaign to Fresha users
- [ ] Set up referral program ($20 credit per referral)
- [ ] Activate social media presence
- [ ] Monitor server load and scale as needed
- [ ] Track key metrics daily

---

## Success Metrics Tracking

### Launch Requirements (Must Have) ✅
- [ ] ✅ Zero payment processing errors in testing
- [ ] ✅ Mobile booking works on iOS/Android
- [ ] ✅ Gift certificates never charge wrong source
- [ ] ✅ Data import from CSV with rollback
- [ ] ✅ Database response time < 100ms (p95)
- [ ] ✅ 99.9% uptime SLA

### Week 4 Post-Launch Metrics
- [ ] 10 active salons
- [ ] < 0.1% payment error rate
- [ ] 95% mobile completion rate
- [ ] Zero data loss incidents
- [ ] < 2 hour support response time

### Monthly Metrics (Ongoing)
- [ ] Monthly churn rate < 5%
- [ ] Payment error rate < 0.1%
- [ ] Database uptime > 99.9%
- [ ] Average support response < 2 hours
- [ ] Customer satisfaction score (track via surveys)

---

## Risk Mitigation

### Database Connection Limits (Low Probability, High Impact)
- [x] Neon connection pooling configured
- [ ] Connection pool monitoring dashboard
- [ ] Alert on high connection usage (>80%)
- [ ] Connection leak detection and testing

### Payment Processing Bugs (Medium Probability, High Impact)
- [ ] Extensive unit tests for payment logic
- [ ] Payment audit logs for every transaction
- [ ] Manual QA for all payment flows
- [ ] Real-time payment error monitoring
- [ ] Automated alerts for failed payments

### Data Migration Errors (Medium Probability, High Impact)
- [ ] Database transactions with rollback
- [ ] Data preview before import
- [ ] Import validation with error reports
- [ ] Test with real Fresha export data
- [ ] Manual verification for beta salons

### Database Failover Issues (Low Probability, High Impact)
- [ ] Neon automatic failover enabled
- [ ] Point-in-time recovery tested
- [ ] Weekly database backups to S3
- [ ] Disaster recovery plan documented
- [ ] Recovery tested quarterly

---

## Out of Scope (Not in MVP) ❌

Items explicitly NOT included in initial 8-week build:
- ❌ Marketplace/discovery features
- ❌ Inventory management
- ❌ Advanced analytics/reporting
- ❌ Multi-location support (schema ready, UI not built)
- ❌ Custom mobile apps (PWA only)
- ❌ POS system integration
- ❌ Email marketing tools
- ❌ Loyalty programs beyond basic memberships

---

## Notes

- **Payment Processing**: This is the MOST CRITICAL feature. Triple-check all payment flows.
- **Mobile Optimization**: Public booking must work flawlessly on mobile (>95% completion rate).
- **Data Integrity**: 100% migration success rate is required for trust.
- **Performance**: Database p95 < 100ms is crucial for good UX.
- **Audit Logging**: Every payment decision must be logged for debugging disputes.

**Pioneer Pricing**: First 50 customers locked in at $3/staff/month for 12 months (normally $5).

---

**Total Estimated Tasks**: ~450 items
**Average per Week**: ~56 items
**Critical Path**: Payment System → Mobile Booking → Data Import
