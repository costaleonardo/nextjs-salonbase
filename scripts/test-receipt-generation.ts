/**
 * Test Receipt Generation
 *
 * This script demonstrates and tests the receipt generation functionality.
 * Run with: npx tsx scripts/test-receipt-generation.ts
 */

import { renderEmailToHtml } from "@/lib/email";
import ReceiptEmail from "@/lib/email-templates/receipt";
import { writeFileSync } from "fs";
import { join } from "path";

// Sample receipt data
const sampleReceiptData = {
  salonName: "Luxe Beauty Salon",
  salonEmail: "info@luxebeauty.com",
  salonPhone: "(555) 123-4567",
  salonAddress: "123 Main Street, Suite 200, New York, NY 10001",
  clientName: "Jane Smith",
  clientEmail: "jane.smith@example.com",
  appointmentDate: "January 15, 2026",
  appointmentTime: "2:30 PM",
  serviceName: "Premium Haircut & Style",
  staffName: "Sarah Johnson",
  amount: 85.0,
  paymentMethod: "Credit Card",
  paymentDate: "January 15, 2026",
  receiptNumber: "RCPT-20260115-ABC12",
  transactionId: "pi_3OdGz4HfKPi7ePBk1234567890",
  giftCertificateApplied: undefined,
};

// Sample receipt with gift certificate
const sampleReceiptWithGiftCert = {
  ...sampleReceiptData,
  clientName: "John Doe",
  clientEmail: "john.doe@example.com",
  amount: 50.0,
  giftCertificateApplied: 35.0,
  receiptNumber: "RCPT-20260115-XYZ89",
  transactionId: "pi_3OdGz4HfKPi7ePBk0987654321",
};

async function runTests() {
  console.log("🧪 Testing Receipt Generation...\n");

  try {
    // Test 1: Generate receipt without gift certificate
    console.log("✅ Test 1: Generating standard receipt...");
    const html1 = await renderEmailToHtml(ReceiptEmail(sampleReceiptData));
    const outputPath1 = join(process.cwd(), "test-receipt-standard.html");
    writeFileSync(outputPath1, html1);
    console.log(`   📄 Saved to: ${outputPath1}\n`);

    // Test 2: Generate receipt with gift certificate
    console.log("✅ Test 2: Generating receipt with gift certificate...");
    const html2 = await renderEmailToHtml(ReceiptEmail(sampleReceiptWithGiftCert));
    const outputPath2 = join(process.cwd(), "test-receipt-with-giftcert.html");
    writeFileSync(outputPath2, html2);
    console.log(`   📄 Saved to: ${outputPath2}\n`);

    console.log("✨ All tests passed!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Open the generated HTML files in a browser to preview");
    console.log("   2. Configure EMAIL_API_KEY in .env.local to enable email sending");
    console.log("   3. Test actual email delivery with sendReceipt() server action");
    console.log("\n💡 Usage in code:");
    console.log('   import { sendReceipt } from "@/app/actions/receipts"');
    console.log("   await sendReceipt(paymentId)");
    console.log("   // Or with custom email:");
    console.log('   await sendReceipt(paymentId, "custom@email.com")\n');
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
