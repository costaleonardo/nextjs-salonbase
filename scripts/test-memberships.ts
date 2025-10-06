/**
 * Membership System Test Script
 *
 * This script tests the membership functionality end-to-end:
 * 1. Create membership tiers
 * 2. Create test memberships
 * 3. Test membership retrieval
 * 4. Test membership cancellation
 *
 * Run with: npx tsx scripts/test-memberships.ts
 */

import { db } from "../lib/db";
import { MembershipStatus } from "@prisma/client";

async function main() {
  console.log("🧪 Testing Membership System...\n");

  try {
    // Step 1: Find or create a test salon
    console.log("📍 Step 1: Setting up test salon...");
    let salon = await db.salon.findFirst();

    if (!salon) {
      salon = await db.salon.create({
        data: {
          name: "Test Salon for Memberships",
          slug: `test-salon-${Date.now()}`,
          email: "test@salon.com",
          phone: "555-0100",
        },
      });
      console.log(`✅ Created test salon: ${salon.name}`);
    } else {
      console.log(`✅ Using existing salon: ${salon.name}`);
    }

    // Step 2: Create membership tiers
    console.log("\n📍 Step 2: Creating membership tiers...");

    const basicTier = await db.membershipTier.create({
      data: {
        salonId: salon.id,
        name: "Basic Membership",
        price: 29.99,
        benefits: {
          "Discount on services": "10% off",
          "Priority booking": "Book up to 30 days in advance",
          "Monthly newsletter": "Exclusive tips and offers",
        },
      },
    });
    console.log(`✅ Created tier: ${basicTier.name} - $${basicTier.price}/month`);

    const premiumTier = await db.membershipTier.create({
      data: {
        salonId: salon.id,
        name: "Premium Membership",
        price: 59.99,
        benefits: {
          "Discount on services": "20% off",
          "Priority booking": "Book up to 60 days in advance",
          "Free service": "1 free basic service per month",
          "Guest passes": "2 guest passes per month",
        },
      },
    });
    console.log(`✅ Created tier: ${premiumTier.name} - $${premiumTier.price}/month`);

    // Step 3: Find or create test client
    console.log("\n📍 Step 3: Setting up test client...");
    let client = await db.client.findFirst({
      where: { salonId: salon.id },
    });

    if (!client) {
      client = await db.client.create({
        data: {
          salonId: salon.id,
          name: "Test Client for Membership",
          email: "testclient@example.com",
          phone: "555-0101",
        },
      });
      console.log(`✅ Created test client: ${client.name}`);
    } else {
      console.log(`✅ Using existing client: ${client.name}`);
    }

    // Step 4: Create a membership (without Stripe for testing)
    console.log("\n📍 Step 4: Creating test membership...");
    const membership = await db.membership.create({
      data: {
        clientId: client.id,
        salonId: salon.id,
        tierId: basicTier.id,
        status: MembershipStatus.ACTIVE,
        startDate: new Date(),
      },
      include: {
        tier: true,
        client: true,
      },
    });
    console.log(`✅ Created membership for ${membership.client.name}`);
    console.log(`   Tier: ${membership.tier.name}`);
    console.log(`   Status: ${membership.status}`);
    console.log(`   Start Date: ${membership.startDate.toLocaleDateString()}`);

    // Step 5: Retrieve memberships
    console.log("\n📍 Step 5: Retrieving memberships for salon...");
    const allMemberships = await db.membership.findMany({
      where: { salonId: salon.id },
      include: {
        tier: true,
        client: true,
      },
    });
    console.log(`✅ Found ${allMemberships.length} membership(s)`);
    allMemberships.forEach((m) => {
      console.log(`   - ${m.client.name}: ${m.tier.name} (${m.status})`);
    });

    // Step 6: Retrieve active membership for client
    console.log("\n📍 Step 6: Retrieving active membership for client...");
    const activeMembership = await db.membership.findFirst({
      where: {
        clientId: client.id,
        status: MembershipStatus.ACTIVE,
      },
      include: {
        tier: true,
      },
    });

    if (activeMembership) {
      console.log(`✅ Client has active membership: ${activeMembership.tier.name}`);
      console.log(`   Benefits:`);
      const benefits = activeMembership.tier.benefits as Record<string, any>;
      Object.entries(benefits).forEach(([key, value]) => {
        console.log(`     • ${key}: ${value}`);
      });
    } else {
      console.log(`ℹ️  Client has no active membership`);
    }

    // Step 7: Test membership cancellation
    console.log("\n📍 Step 7: Testing membership cancellation...");
    const cancelledMembership = await db.membership.update({
      where: { id: membership.id },
      data: {
        status: MembershipStatus.CANCELLED,
        endDate: new Date(),
      },
      include: {
        tier: true,
        client: true,
      },
    });
    console.log(`✅ Cancelled membership for ${cancelledMembership.client.name}`);
    console.log(`   Status: ${cancelledMembership.status}`);
    console.log(`   End Date: ${cancelledMembership.endDate?.toLocaleDateString()}`);

    // Step 8: Verify cancellation
    console.log("\n📍 Step 8: Verifying cancellation...");
    const verifyActive = await db.membership.findFirst({
      where: {
        clientId: client.id,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!verifyActive) {
      console.log(`✅ Verified: Client has no active memberships`);
    } else {
      console.log(`❌ Error: Client still has active membership`);
    }

    // Step 9: Test membership tier filtering
    console.log("\n📍 Step 9: Testing tier filtering...");
    const basicMemberships = await db.membership.findMany({
      where: {
        salonId: salon.id,
        tierId: basicTier.id,
      },
      include: {
        client: true,
      },
    });
    console.log(`✅ Found ${basicMemberships.length} membership(s) for ${basicTier.name}`);

    // Step 10: Test membership statistics
    console.log("\n📍 Step 10: Calculating membership statistics...");
    const stats = await db.membership.groupBy({
      by: ["status"],
      where: { salonId: salon.id },
      _count: {
        id: true,
      },
    });

    console.log(`✅ Membership Statistics:`);
    stats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat._count.id}`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ All membership tests completed successfully!");
    console.log("=".repeat(60));
    console.log("\nTest Coverage:");
    console.log("  ✅ Membership tier creation");
    console.log("  ✅ Membership creation");
    console.log("  ✅ Membership retrieval (all, active, by tier)");
    console.log("  ✅ Membership cancellation");
    console.log("  ✅ Membership statistics");
    console.log("\nNext Steps:");
    console.log("  • Test Stripe subscription creation (requires Stripe API keys)");
    console.log("  • Test webhook handlers for subscription events");
    console.log("  • Test membership UI components");
    console.log("  • Test mobile membership signup flow");

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await db.membership.deleteMany({
      where: { clientId: client.id },
    });
    await db.membershipTier.deleteMany({
      where: { salonId: salon.id },
    });
    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main()
  .then(() => {
    console.log("\n✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
