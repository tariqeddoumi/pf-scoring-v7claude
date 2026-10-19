#!/usr/bin/env node

/**
 * Post-build script to run Prisma migrations
 * Only runs when RUN_MIGRATIONS=true and a direct (non-pooled) database URL is available
 */

const { execSync } = require("child_process");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("⏭️  Skipping migrations: DATABASE_URL not set");
  process.exit(0);
}

// Les migrations de production sont appliquées directement dans Supabase : les rejouer à
// chaque build est inutile, et risqué si la table _prisma_migrations ne les connaît pas.
// Elles ne tournent donc que sur demande explicite (RUN_MIGRATIONS=true).
if (process.env.RUN_MIGRATIONS !== "true") {
  console.log("⏭️  Skipping migrations: set RUN_MIGRATIONS=true to apply them at build time");
  process.exit(0);
}

// Le pooler Supabase en mode transaction (port 6543, pgbouncer=true) ne gère pas les verrous
// consultatifs de Prisma Migrate : `migrate deploy` reste bloqué jusqu'à l'expiration du
// build (constaté sur Hostinger). Il faut une connexion directe, fournie par DIRECT_URL.
const urlMigration = process.env.DIRECT_URL || databaseUrl;
if (/:6543\b|pgbouncer=true/.test(urlMigration)) {
  console.error("❌ Migrations refused: DATABASE_URL points to the transaction pooler; set DIRECT_URL (port 5432)");
  process.exit(1);
}

try {
  console.log("🔄 Running Prisma migrations...");
  execSync("prisma migrate deploy", {
    stdio: "inherit",
    timeout: 120000,
    env: { ...process.env, DATABASE_URL: urlMigration },
  });
  console.log("✅ Migrations completed successfully");
} catch (error) {
  // Un échec de migration est bloquant : un build « réussi » sur un schéma non
  // migré déploierait une application incompatible avec sa base.
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
