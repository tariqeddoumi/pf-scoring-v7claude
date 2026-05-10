#!/usr/bin/env node

/**
 * Post-build script to run Prisma migrations
 * Only runs if DATABASE_URL is set (production environments)
 */

const { execSync } = require("child_process");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("⏭️  Skipping migrations: DATABASE_URL not set");
  process.exit(0);
}

try {
  console.log("🔄 Running Prisma migrations...");
  execSync("prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Migrations completed successfully");
} catch (error) {
  console.warn("⚠️  Migration failed (non-fatal):", error.message);
  process.exit(0);
}
