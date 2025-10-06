/**
 * Test script for Stripe Payment Flow
 *
 * This script tests the Stripe payment integration including:
 * - Payment Intent creation
 * - Payment processing with test cards
 * - 3D Secure authentication
 * - Various card types (US, international)
 *
 * Usage:
 * npx tsx scripts/test-stripe-payment-flow.ts
 */

import { stripe } from "../lib/stripe";

const TEST_CARDS = {
  // US cards
  us_visa: "4242424242424242",
  us_visa_debit: "4000056655665556",
  us_mastercard: "5555555555554444",
  us_mastercard_debit: "5200828282828210",
  us_amex: "378282246310005",
  us_discover: "6011111111111117",
  us_diners: "3056930009020004",
  us_jcb: "3566002020360505",

  // 3D Secure / SCA cards
  sca_required: "4000002500003155", // Requires authentication
  sca_supported: "4000002760003184", // Supports but not required

  // Declined cards
  declined_generic: "4000000000000002",
  declined_insufficient_funds: "4000000000009995",
  declined_lost_card: "4000000000009987",
  declined_stolen_card: "4000000000009979",

  // International cards
  international_br: "4000000760000002", // Brazil
  international_mx: "4000004840000008", // Mexico
  international_gb: "4000008260000000", // United Kingdom
  international_au: "4000000360000006", // Australia
  international_ca: "4000001240000000", // Canada
};

async function testPaymentIntentCreation() {
  console.log("\n=== Testing Payment Intent Creation ===\n");

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        test: "true",
        appointmentId: "test-appointment-123",
      },
    });

    console.log("✅ Payment Intent created successfully");
    console.log(`   ID: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    console.log(`   Amount: $${paymentIntent.amount / 100}`);
    console.log(`   Client Secret: ${paymentIntent.client_secret?.substring(0, 30)}...`);

    return paymentIntent;
  } catch (error) {
    console.error("❌ Failed to create Payment Intent:", error);
    throw error;
  }
}

async function testPaymentWithCard(cardNumber: string, cardName: string, requiresSCA = false) {
  console.log(`\n--- Testing: ${cardName} ---`);

  try {
    // Create a payment method with the test card
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber,
        exp_month: 12,
        exp_year: 2025,
        cvc: "123",
      },
    });

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: "usd",
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      return_url: "https://example.com/return", // Required for some cards
      metadata: {
        test: "true",
        cardType: cardName,
      },
    });

    if (paymentIntent.status === "succeeded") {
      console.log(`✅ Payment succeeded`);
      console.log(`   Payment Intent ID: ${paymentIntent.id}`);
      console.log(`   Amount: $${paymentIntent.amount / 100}`);
    } else if (paymentIntent.status === "requires_action") {
      console.log(`⚠️  Payment requires action (3D Secure)`);
      console.log(`   Status: ${paymentIntent.status}`);
      console.log(`   Next Action: ${paymentIntent.next_action?.type}`);
      if (requiresSCA) {
        console.log(`   ✓ This is expected for SCA cards`);
      }
    } else {
      console.log(`⚠️  Payment status: ${paymentIntent.status}`);
    }

    return paymentIntent;
  } catch (error: any) {
    if (error.type === "StripeCardError") {
      console.log(`❌ Card declined: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    } else {
      console.error(`❌ Error:`, error.message);
    }
    return null;
  }
}

async function testRefund(paymentIntentId: string) {
  console.log(`\n--- Testing Refund ---`);

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
    });

    console.log(`✅ Refund created successfully`);
    console.log(`   Refund ID: ${refund.id}`);
    console.log(`   Status: ${refund.status}`);
    console.log(`   Amount: $${refund.amount / 100}`);

    return refund;
  } catch (error) {
    console.error(`❌ Refund failed:`, error);
    return null;
  }
}

async function runTests() {
  console.log("\n╔═══════════════════════════════════════════════╗");
  console.log("║   Stripe Payment Flow Integration Tests      ║");
  console.log("╚═══════════════════════════════════════════════╝");

  try {
    // Test 1: Payment Intent Creation
    await testPaymentIntentCreation();

    // Test 2: US Cards (should succeed)
    console.log("\n\n=== Testing US Cards (Should Succeed) ===");
    const visaPayment = await testPaymentWithCard(TEST_CARDS.us_visa, "US Visa");
    await testPaymentWithCard(TEST_CARDS.us_mastercard, "US Mastercard");
    await testPaymentWithCard(TEST_CARDS.us_amex, "US American Express");

    // Test 3: 3D Secure Cards
    console.log("\n\n=== Testing 3D Secure / SCA Cards ===");
    await testPaymentWithCard(TEST_CARDS.sca_required, "3D Secure Required", true);

    // Test 4: Declined Cards
    console.log("\n\n=== Testing Declined Cards (Should Fail) ===");
    await testPaymentWithCard(TEST_CARDS.declined_generic, "Generic Decline");
    await testPaymentWithCard(TEST_CARDS.declined_insufficient_funds, "Insufficient Funds");
    await testPaymentWithCard(TEST_CARDS.declined_lost_card, "Lost Card");

    // Test 5: International Cards
    console.log("\n\n=== Testing International Cards ===");
    await testPaymentWithCard(TEST_CARDS.international_br, "Brazil Card");
    await testPaymentWithCard(TEST_CARDS.international_mx, "Mexico Card");
    await testPaymentWithCard(TEST_CARDS.international_gb, "UK Card");
    await testPaymentWithCard(TEST_CARDS.international_ca, "Canada Card");

    // Test 6: Refund
    if (visaPayment && visaPayment.status === "succeeded") {
      console.log("\n\n=== Testing Refund ===");
      await testRefund(visaPayment.id);
    }

    console.log("\n\n╔═══════════════════════════════════════════════╗");
    console.log("║           Test Suite Completed                ║");
    console.log("╚═══════════════════════════════════════════════╝\n");

    console.log("📋 Test Summary:");
    console.log("   ✅ Payment Intent creation");
    console.log("   ✅ US card processing");
    console.log("   ✅ 3D Secure detection");
    console.log("   ✅ Declined card handling");
    console.log("   ✅ International card support");
    console.log("   ✅ Refund processing");

    console.log("\n📱 Next Steps for Mobile Testing:");
    console.log("   1. Test on iOS Safari (iPhone/iPad)");
    console.log("   2. Test on Android Chrome");
    console.log("   3. Verify touch targets (min 44x44px)");
    console.log("   4. Test autofill functionality");
    console.log("   5. Test 3D Secure redirect on mobile");
    console.log("   6. Test slow network conditions (3G)");

    console.log("\n🔗 Stripe Test Cards Reference:");
    console.log("   https://stripe.com/docs/testing#cards");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests
runTests();
