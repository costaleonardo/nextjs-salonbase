/**
 * Verification script for mobile optimization implementation
 * Run with: npx tsx scripts/verify-mobile-optimization.ts
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

type CheckResult = {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
};

const results: CheckResult[] = [];

function check(name: string, condition: boolean, message: string, warningOnly = false) {
  results.push({
    name,
    status: condition ? "pass" : warningOnly ? "warning" : "fail",
    message,
  });
}

function fileExists(path: string): boolean {
  return existsSync(join(process.cwd(), path));
}

function fileContains(path: string, search: string | RegExp): boolean {
  try {
    const content = readFileSync(join(process.cwd(), path), "utf-8");
    if (typeof search === "string") {
      return content.includes(search);
    }
    return search.test(content);
  } catch {
    return false;
  }
}

console.log("🔍 Verifying Mobile Optimization Implementation...\n");

// 1. Touch Targets (44x44px)
console.log("1️⃣  Touch Targets (44x44px)");
check(
  "Service selection touch targets",
  fileContains("app/book/[salonSlug]/components/service-selection.tsx", "minHeight: '44px'"),
  "Service selection buttons have 44px minimum height"
);
check(
  "Staff selection touch targets",
  fileContains("app/book/[salonSlug]/components/staff-selection.tsx", "minHeight: '44px'"),
  "Staff selection buttons have 44px minimum height"
);
check(
  "DateTime selection touch targets",
  fileContains("app/book/[salonSlug]/components/datetime-selection.tsx", "minHeight: '44px'"),
  "DateTime selection buttons have 44px minimum height"
);
check(
  "Client form touch targets",
  fileContains("app/book/[salonSlug]/components/client-form.tsx", "minHeight: '44px'"),
  "Client form inputs have 44px minimum height"
);

// 2. Autofill Support
console.log("\n2️⃣  Autofill Support");
check(
  "Name autofill",
  fileContains("app/book/[salonSlug]/components/client-form.tsx", 'autoComplete="name"'),
  'Name field has autoComplete="name"'
);
check(
  "Email autofill",
  fileContains("app/book/[salonSlug]/components/client-form.tsx", 'autoComplete="email"'),
  'Email field has autoComplete="email"'
);
check(
  "Phone autofill",
  fileContains("app/book/[salonSlug]/components/client-form.tsx", 'autoComplete="tel"'),
  'Phone field has autoComplete="tel"'
);

// 3. Loading States
console.log("\n3️⃣  Loading States");
check(
  "Loading skeleton component",
  fileExists("components/ui/loading-skeleton.tsx"),
  "Loading skeleton component created"
);
check(
  "TimeSlotsSkeleton exists",
  fileContains("components/ui/loading-skeleton.tsx", "TimeSlotsSkeleton"),
  "TimeSlotsSkeleton component defined"
);
check(
  "Skeleton used in datetime selection",
  fileContains("app/book/[salonSlug]/components/datetime-selection.tsx", "TimeSlotsSkeleton"),
  "TimeSlotsSkeleton imported and used"
);
check(
  "Client form loading state",
  fileContains("app/book/[salonSlug]/components/client-form.tsx", "isSubmitting"),
  "Client form has loading state"
);

// 4. Offline Detection
console.log("\n4️⃣  Offline Detection");
check(
  "useOnlineStatus hook",
  fileExists("lib/hooks/use-online-status.ts"),
  "useOnlineStatus hook created"
);
check(
  "OfflineBanner component",
  fileExists("components/ui/offline-banner.tsx"),
  "OfflineBanner component created"
);
check(
  "OfflineBanner uses hook",
  fileContains("components/ui/offline-banner.tsx", "useOnlineStatus"),
  "OfflineBanner uses useOnlineStatus hook"
);
check(
  "OfflineBanner in booking widget",
  fileContains("app/book/[salonSlug]/components/booking-widget.tsx", "OfflineBanner"),
  "OfflineBanner integrated in booking widget"
);

// 5. Retry Logic
console.log("\n5️⃣  Retry Logic");
check(
  "Retry utility exists",
  fileExists("lib/utils/fetch-with-retry.ts"),
  "fetch-with-retry utility created"
);
check(
  "fetchWithRetry function",
  fileContains("lib/utils/fetch-with-retry.ts", "fetchWithRetry"),
  "fetchWithRetry function defined"
);
check(
  "serverActionWithRetry function",
  fileContains("lib/utils/fetch-with-retry.ts", "serverActionWithRetry"),
  "serverActionWithRetry wrapper defined"
);
check(
  "useRetryState hook",
  fileContains("lib/utils/fetch-with-retry.ts", "useRetryState"),
  "useRetryState hook defined"
);

// 6. Payment Form
console.log("\n6️⃣  Payment Form");
check(
  "Mobile Stripe form",
  fileExists("components/payment/mobile-stripe-form.tsx"),
  "Mobile-optimized Stripe form created"
);
check(
  "Stripe form font size",
  fileContains("components/payment/mobile-stripe-form.tsx", "fontSize: '16px'"),
  "Stripe form prevents iOS zoom with 16px font"
);
check(
  "Fallback form exists",
  fileContains("components/payment/mobile-stripe-form.tsx", "SimpleFallbackCardForm"),
  "Fallback form for Stripe Elements failures"
);

// 7. Viewport Configuration
console.log("\n7️⃣  Viewport Configuration");
check(
  "Viewport meta in layout",
  fileContains("app/layout.tsx", "viewport"),
  "Viewport configuration in root layout"
);
check(
  "Theme color set",
  fileContains("app/layout.tsx", "themeColor"),
  "Theme color for mobile browsers"
);
check(
  "Apple Web App config",
  fileContains("app/layout.tsx", "appleWebApp"),
  "Apple Web App configuration"
);

// 8. LocalStorage Persistence
console.log("\n8️⃣  LocalStorage Persistence");
check(
  "Save to localStorage",
  fileContains("app/book/[salonSlug]/components/booking-widget.tsx", "localStorage.setItem"),
  "Booking progress saved to localStorage"
);
check(
  "Load from localStorage",
  fileContains("app/book/[salonSlug]/components/booking-widget.tsx", "localStorage.getItem"),
  "Booking progress loaded from localStorage"
);
check(
  "Clear localStorage on completion",
  fileContains("app/book/[salonSlug]/components/booking-widget.tsx", "localStorage.removeItem"),
  "localStorage cleared after booking completion"
);

// 9. Documentation
console.log("\n9️⃣  Documentation");
check(
  "Mobile optimization checklist",
  fileExists("docs/mobile-optimization-checklist.md"),
  "Mobile optimization checklist created"
);
check(
  "Mobile testing guide",
  fileExists("docs/mobile-testing-guide.md"),
  "Mobile testing guide created"
);
check(
  "Mobile optimization summary",
  fileExists("docs/mobile-optimization-summary.md"),
  "Mobile optimization summary created"
);
check(
  "Completion document",
  fileExists("MOBILE_OPTIMIZATION_COMPLETE.md"),
  "Completion documentation created"
);

// 10. CHECKLIST.md Updates
console.log("\n🔟 CHECKLIST.md Updates");
check(
  "Touch targets marked complete",
  fileContains("docs/todos/CHECKLIST.md", /- \[x\] Optimize touch targets/),
  "Touch targets task marked complete"
);
check(
  "Autofill marked complete",
  fileContains("docs/todos/CHECKLIST.md", /- \[x\] Implement autofill support/),
  "Autofill task marked complete"
);
check(
  "Loading states marked complete",
  fileContains("docs/todos/CHECKLIST.md", /- \[x\] Add loading states/),
  "Loading states task marked complete"
);
check(
  "Offline behavior marked complete",
  fileContains("docs/todos/CHECKLIST.md", /- \[x\] Test offline behavior/),
  "Offline behavior task marked complete"
);

// Print results
console.log("\n" + "=".repeat(60));
console.log("VERIFICATION RESULTS");
console.log("=".repeat(60));

const passed = results.filter((r) => r.status === "pass").length;
const failed = results.filter((r) => r.status === "fail").length;
const warnings = results.filter((r) => r.status === "warning").length;

results.forEach((result) => {
  const icon = result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} ${result.message}`);
});

console.log("\n" + "=".repeat(60));
console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log("=".repeat(60));

if (failed === 0) {
  console.log("\n🎉 All mobile optimization checks passed!");
  console.log("✅ Ready for manual device testing");
  process.exit(0);
} else {
  console.log("\n⚠️  Some checks failed. Please review the implementation.");
  process.exit(1);
}
