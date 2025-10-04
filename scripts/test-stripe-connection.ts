/**
 * Test script to verify Stripe connection
 *
 * This script tests the Stripe API connection by:
 * 1. Verifying the API key is valid
 * 2. Retrieving account information
 * 3. Listing payment methods
 *
 * Run with: npx tsx scripts/test-stripe-connection.ts
 */

import { stripe } from "@/lib/stripe"

async function testStripeConnection() {
  console.log("🔍 Testing Stripe connection...\n")

  try {
    // Test 1: Retrieve account information
    console.log("1. Retrieving Stripe account information...")
    const account = await stripe.balance.retrieve()

    console.log("✅ Successfully connected to Stripe!")
    console.log(`   Available balance: ${account.available.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", ")}`)
    console.log(`   Pending balance: ${account.pending.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", ")}\n`)

    // Test 2: List recent payment intents (limit to 1 to verify read access)
    console.log("2. Testing API access by listing payment intents...")
    const paymentIntents = await stripe.paymentIntents.list({ limit: 1 })

    console.log(`✅ API access verified!`)
    console.log(`   Found ${paymentIntents.data.length} recent payment intent(s)\n`)

    // Test 3: Verify webhook secret is set (if configured)
    console.log("3. Checking webhook secret configuration...")
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (webhookSecret && webhookSecret !== "whsec_...") {
      console.log("✅ Webhook secret is configured\n")
    } else {
      console.log("⚠️  Webhook secret not configured yet (will be needed for production)\n")
    }

    // Test 4: Create a test payment intent (then immediately cancel it)
    console.log("4. Testing payment intent creation...")
    const testIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: "usd",
      description: "Test payment intent - SalonBase connection test",
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log(`✅ Payment intent created successfully!`)
    console.log(`   ID: ${testIntent.id}`)
    console.log(`   Amount: $${testIntent.amount / 100}`)
    console.log(`   Status: ${testIntent.status}\n`)

    // Cancel the test payment intent
    console.log("5. Cancelling test payment intent...")
    await stripe.paymentIntents.cancel(testIntent.id)
    console.log("✅ Test payment intent cancelled\n")

    console.log("=" .repeat(60))
    console.log("✅ ALL TESTS PASSED! Stripe integration is ready.")
    console.log("=" .repeat(60))

  } catch (error) {
    console.error("\n❌ Stripe connection test failed!")

    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`)

      // Provide helpful hints for common errors
      if (error.message.includes("Invalid API Key")) {
        console.error("\n💡 Hint: Check that STRIPE_SECRET_KEY is set correctly in .env.local")
        console.error("   It should start with 'sk_test_' for test mode")
      } else if (error.message.includes("authentication")) {
        console.error("\n💡 Hint: Your API key may be incorrect or revoked")
        console.error("   Get a new one from: https://dashboard.stripe.com/test/apikeys")
      }
    } else {
      console.error(error)
    }

    process.exit(1)
  }
}

// Run the test
testStripeConnection()
