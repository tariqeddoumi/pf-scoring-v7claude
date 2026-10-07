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

// On Vercel, DATABASE_URL points to the Supabase transaction pooler (port 6543),
// which does not support the advisory locks Prisma Migrate needs — `migrate deploy`
// hangs until the build times out. Migrations are applied directly to Supabase.
if (process.env.VERCEL) {
  console.log("⏭️  Skipping migrations on Vercel: migrations are managed directly in Supabase");
  process.exit(0);
}

try {
  console.log("🔄 Running Prisma migrations...");
  execSync("prisma migrate deploy", { stdio: "inherit", timeout: 120000 });
  console.log("✅ Migrations completed successfully");
} catch (error) {
  // Un échec de migration est bloquant : un build « réussi » sur un schéma non
  // migré déploierait une application incompatible avec sa base.
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
