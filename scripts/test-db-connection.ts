// Load environment variables from .env.local BEFORE any other imports
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

// Now import PrismaClient
import { PrismaClient } from "@prisma/client";

async function testConnection() {
  const prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });

  try {
    console.log("Testing database connection...");
    console.log("Using DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Not set");

    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database connection successful!");
    console.log("Query result:", result);

    // Test schema by counting tables
    const tables = (await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as Array<{ table_name: string }>;

    console.log("\n📊 Database tables created:");
    tables.forEach((table) => {
      console.log(`  - ${table.table_name}`);
    });

    console.log(`\n✅ Total tables: ${tables.length}`);
    console.log("\n🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
