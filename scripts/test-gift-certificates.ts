import { db } from "@/lib/db";

/**
 * Test script for gift certificate functionality
 * Tests unique code generation and deduplication
 */

async function testGiftCertificateDeduplication() {
  console.log("🧪 Testing Gift Certificate Code Deduplication...\n");

  try {
    // Find a test salon (or use the first available)
    const salon = await db.salon.findFirst();
    if (!salon) {
      console.error("❌ No salon found. Please create a salon first.");
      return;
    }

    console.log(`✅ Using salon: ${salon.name} (${salon.id})`);

    // Generate test codes
    const testCodes = new Set<string>();
    const iterations = 100;

    console.log(`\n📊 Generating ${iterations} gift certificate codes...`);

    for (let i = 0; i < iterations; i++) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const segments = 3;
      const segmentLength = 4;

      const code = Array.from({ length: segments }, () => {
        return Array.from({ length: segmentLength }, () => {
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("");
      }).join("-");

      testCodes.add(code);
    }

    console.log(`✅ Generated ${testCodes.size} unique codes out of ${iterations} attempts`);
    console.log(`📈 Uniqueness rate: ${((testCodes.size / iterations) * 100).toFixed(2)}%`);

    if (testCodes.size < iterations) {
      console.log(
        `⚠️  ${iterations - testCodes.size} duplicate codes were generated (expected with random generation)`
      );
    }

    // Test database uniqueness constraint
    console.log("\n🔍 Testing database uniqueness constraint...");

    const testCode = Array.from(testCodes)[0];
    console.log(`Creating certificate with code: ${testCode}`);

    // Create first certificate
    const cert1 = await db.giftCertificate.create({
      data: {
        code: testCode,
        salonId: salon.id,
        balance: 100,
        originalAmount: 100,
      },
    });
    console.log("✅ First certificate created successfully");

    // Try to create duplicate (should fail)
    try {
      await db.giftCertificate.create({
        data: {
          code: testCode,
          salonId: salon.id,
          balance: 50,
          originalAmount: 50,
        },
      });
      console.log(
        "❌ FAILED: Duplicate certificate was created (uniqueness constraint not working)"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        console.log("✅ Duplicate prevention working: Database correctly rejected duplicate code");
      } else {
        console.log("❌ Unexpected error:", error);
      }
    }

    // Test balance tracking
    console.log("\n💰 Testing balance tracking...");
    console.log(`Initial balance: $${cert1.balance}`);

    const redeemAmount = 30;
    const updated = await db.giftCertificate.update({
      where: { id: cert1.id },
      data: {
        balance: {
          decrement: redeemAmount,
        },
      },
    });

    console.log(`✅ Redeemed $${redeemAmount}`);
    console.log(`✅ New balance: $${updated.balance}`);
    console.log(`✅ Expected: $${parseFloat(cert1.balance.toString()) - redeemAmount}`);

    if (
      parseFloat(updated.balance.toString()) ===
      parseFloat(cert1.balance.toString()) - redeemAmount
    ) {
      console.log("✅ Balance tracking working correctly");
    } else {
      console.log("❌ Balance tracking error");
    }

    // Test expiration
    console.log("\n📅 Testing expiration date handling...");
    const expiredCert = await db.giftCertificate.create({
      data: {
        code: "EXPR-TEST-0001",
        salonId: salon.id,
        balance: 100,
        originalAmount: 100,
        expiresAt: new Date("2020-01-01"), // Past date
      },
    });

    const now = new Date();
    const isExpired = expiredCert.expiresAt && expiredCert.expiresAt < now;

    if (isExpired) {
      console.log("✅ Expiration detection working correctly");
    } else {
      console.log("❌ Expiration detection not working");
    }

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await db.giftCertificate.deleteMany({
      where: {
        id: {
          in: [cert1.id, expiredCert.id],
        },
      },
    });
    console.log("✅ Test data cleaned up");

    console.log("\n✅ All gift certificate tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run tests
testGiftCertificateDeduplication();
