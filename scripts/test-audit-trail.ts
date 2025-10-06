/**
 * Test Script: Payment Audit Trail Completeness
 *
 * This script verifies that all payment operations are properly logged
 * to the PaymentAuditLog table, which is CRITICAL for dispute resolution.
 */

import { db } from "../lib/db";

async function testAuditTrailCompleteness() {
  console.log("🔍 Testing Payment Audit Trail Completeness...\n");

  try {
    // Test 1: Verify all payments have audit logs
    console.log("Test 1: Checking if all payments have audit logs...");
    const paymentsWithoutLogs = await db.payment.findMany({
      where: {
        auditLogs: {
          none: {},
        },
      },
    });

    if (paymentsWithoutLogs.length > 0) {
      console.log(`❌ FAILED: Found ${paymentsWithoutLogs.length} payments without audit logs`);
      paymentsWithoutLogs.forEach((payment) => {
        console.log(`   - Payment ID: ${payment.id}, Status: ${payment.status}`);
      });
    } else {
      console.log("✅ PASSED: All payments have audit logs\n");
    }

    // Test 2: Verify completed payments have required audit events
    console.log("Test 2: Checking completed payments for required audit events...");
    const completedPayments = await db.payment.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        auditLogs: true,
      },
    });

    const requiredActions = ["source_selected", "payment_succeeded"];
    let missingEvents = 0;

    for (const payment of completedPayments) {
      const actions = payment.auditLogs.map((log) => log.action);
      const missing = requiredActions.filter((required) => !actions.includes(required));

      if (missing.length > 0) {
        missingEvents++;
        console.log(`❌ Payment ${payment.id} missing events: ${missing.join(", ")}`);
      }
    }

    if (missingEvents === 0) {
      console.log(
        `✅ PASSED: All ${completedPayments.length} completed payments have required events\n`
      );
    } else {
      console.log(`❌ FAILED: ${missingEvents} payments missing required events\n`);
    }

    // Test 3: Verify failed payments have rollback logs
    console.log("Test 3: Checking failed payments for rollback logs...");
    const failedPayments = await db.payment.findMany({
      where: {
        status: "FAILED",
      },
      include: {
        auditLogs: true,
      },
    });

    let missingRollbacks = 0;
    for (const payment of failedPayments) {
      const hasRollback = payment.auditLogs.some(
        (log) => log.action === "payment_rolled_back" || log.action.includes("failed")
      );

      if (!hasRollback) {
        missingRollbacks++;
        console.log(`❌ Failed payment ${payment.id} has no rollback log`);
      }
    }

    if (missingRollbacks === 0) {
      console.log(`✅ PASSED: All ${failedPayments.length} failed payments have rollback logs\n`);
    } else {
      console.log(`❌ FAILED: ${missingRollbacks} failed payments missing rollback logs\n`);
    }

    // Test 4: Verify refunded payments have refund logs
    console.log("Test 4: Checking refunded payments for refund logs...");
    const refundedPayments = await db.payment.findMany({
      where: {
        status: "REFUNDED",
      },
      include: {
        auditLogs: true,
      },
    });

    let missingRefundLogs = 0;
    for (const payment of refundedPayments) {
      const hasRefundLog = payment.auditLogs.some((log) => log.action.includes("refund"));

      if (!hasRefundLog) {
        missingRefundLogs++;
        console.log(`❌ Refunded payment ${payment.id} has no refund log`);
      }
    }

    if (missingRefundLogs === 0) {
      console.log(`✅ PASSED: All ${refundedPayments.length} refunded payments have refund logs\n`);
    } else {
      console.log(`❌ FAILED: ${missingRefundLogs} refunded payments missing refund logs\n`);
    }

    // Test 5: Verify gift certificate payments have certificate logs
    console.log("Test 5: Checking gift certificate payments for certificate logs...");
    const giftCertPayments = await db.payment.findMany({
      where: {
        method: "GIFT_CERTIFICATE",
      },
      include: {
        auditLogs: true,
      },
    });

    let missingCertLogs = 0;
    for (const payment of giftCertPayments) {
      const hasCertLog = payment.auditLogs.some((log) => log.action.includes("gift_certificate"));

      if (!hasCertLog) {
        missingCertLogs++;
        console.log(`❌ Gift certificate payment ${payment.id} has no certificate log`);
      }
    }

    if (missingCertLogs === 0) {
      console.log(
        `✅ PASSED: All ${giftCertPayments.length} gift certificate payments have certificate logs\n`
      );
    } else {
      console.log(
        `❌ FAILED: ${missingCertLogs} gift certificate payments missing certificate logs\n`
      );
    }

    // Test 6: Verify audit log chronological ordering
    console.log("Test 6: Checking audit log chronological ordering...");
    const allPayments = await db.payment.findMany({
      include: {
        auditLogs: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    let orderingIssues = 0;
    for (const payment of allPayments) {
      if (payment.auditLogs.length < 2) continue;

      for (let i = 1; i < payment.auditLogs.length; i++) {
        const prev = new Date(payment.auditLogs[i - 1].createdAt);
        const curr = new Date(payment.auditLogs[i].createdAt);

        if (curr < prev) {
          orderingIssues++;
          console.log(`❌ Payment ${payment.id} has out-of-order audit logs`);
          break;
        }
      }
    }

    if (orderingIssues === 0) {
      console.log(`✅ PASSED: All payments have chronologically ordered audit logs\n`);
    } else {
      console.log(`❌ FAILED: ${orderingIssues} payments have ordering issues\n`);
    }

    // Summary
    console.log("━".repeat(60));
    console.log("📊 SUMMARY");
    console.log("━".repeat(60));
    console.log(`Total Payments: ${allPayments.length}`);
    console.log(`Total Audit Log Entries: ${await db.paymentAuditLog.count()}`);
    console.log(`Completed Payments: ${completedPayments.length}`);
    console.log(`Failed Payments: ${failedPayments.length}`);
    console.log(`Refunded Payments: ${refundedPayments.length}`);
    console.log(`Gift Certificate Payments: ${giftCertPayments.length}`);
    console.log("\n✅ Audit trail testing complete!");
  } catch (error) {
    console.error("❌ Error testing audit trail:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

testAuditTrailCompleteness();
