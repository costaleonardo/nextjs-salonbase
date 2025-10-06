/**
 * Verify Stripe Webhook Setup
 *
 * This script checks that all required environment variables and
 * configurations are in place for webhook handling.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

interface CheckResult {
  name: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, successMsg: string, errorMsg: string) {
  results.push({
    name,
    status: condition ? "✅" : "❌",
    message: condition ? successMsg : errorMsg,
  });
}

function warn(name: string, message: string) {
  results.push({
    name,
    status: "⚠️",
    message,
  });
}

console.log("\n🔍 Verifying Stripe Webhook Setup...\n");

// Check Stripe Secret Key
check(
  "Stripe Secret Key",
  !!process.env.STRIPE_SECRET_KEY,
  "STRIPE_SECRET_KEY is configured",
  "STRIPE_SECRET_KEY is missing in .env.local"
);

// Check Stripe Webhook Secret
const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
check(
  "Webhook Secret",
  hasWebhookSecret,
  `STRIPE_WEBHOOK_SECRET is configured${process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ? "" : " (but doesn't start with 'whsec_')"}`,
  "STRIPE_WEBHOOK_SECRET is missing in .env.local"
);

if (!hasWebhookSecret) {
  warn(
    "Setup Instructions",
    "Run 'stripe listen --forward-to localhost:3000/api/webhooks/stripe' and add the webhook secret to .env.local"
  );
}

// Check Stripe Publishable Key
check(
  "Stripe Publishable Key",
  !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is configured",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing in .env.local"
);

// Check Database URL
check(
  "Database URL",
  !!process.env.DATABASE_URL,
  "DATABASE_URL is configured",
  "DATABASE_URL is missing in .env.local"
);

// Check NextAuth Secret
check(
  "NextAuth Secret",
  !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET,
  "NEXTAUTH_SECRET or AUTH_SECRET is configured",
  "NEXTAUTH_SECRET or AUTH_SECRET is missing in .env.local"
);

// Print results
console.log("Environment Variables:");
console.log("━".repeat(60));
results.forEach((result) => {
  console.log(`${result.status} ${result.name}`);
  console.log(`   ${result.message}`);
});
console.log("━".repeat(60));

const hasErrors = results.some((r) => r.status === "❌");
const hasWarnings = results.some((r) => r.status === "⚠️");

if (hasErrors) {
  console.log("\n❌ Setup incomplete. Please fix the errors above.\n");
  process.exit(1);
} else if (hasWarnings) {
  console.log("\n⚠️  Setup complete with warnings. Review the messages above.\n");
} else {
  console.log("\n✅ All checks passed! Webhook setup is ready.\n");
}

// Print next steps
console.log("Next Steps:");
console.log("━".repeat(60));
if (!hasWebhookSecret) {
  console.log("1. Install Stripe CLI: brew install stripe/stripe-cli/stripe");
  console.log("2. Login: stripe login");
  console.log("3. Start webhook forwarding:");
  console.log("   stripe listen --forward-to localhost:3000/api/webhooks/stripe");
  console.log("4. Copy the webhook secret (whsec_...) to .env.local");
  console.log("5. Restart dev server: npm run dev");
} else {
  console.log("1. Start dev server: npm run dev");
  console.log("2. Start webhook forwarding (in new terminal):");
  console.log("   stripe listen --forward-to localhost:3000/api/webhooks/stripe");
  console.log("3. Test webhook events:");
  console.log("   stripe trigger payment_intent.succeeded");
  console.log("   stripe trigger payment_intent.payment_failed");
  console.log("   stripe trigger charge.refunded");
  console.log("4. Check logs for webhook handling");
}
console.log("━".repeat(60));
console.log("\nSee scripts/test-stripe-webhooks.md for detailed testing guide.\n");
