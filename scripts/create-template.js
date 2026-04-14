#!/usr/bin/env node

/**
 * Script pour créer le template Prisma à partir du schéma courant
 * Remplace tous les @@map("BP_PF_*") par @@map("__TABLE_PREFIX___*")
 *
 * Usage:
 *   node scripts/create-template.js
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const TEMPLATE_PATH = path.join(__dirname, '../schema.template.prisma');

try {
  console.log('📝 Création du template Prisma...');

  let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Remplacer les prefixes de tables
  // Patterns:
  // @@map("BP_PF_users") → @@map("__TABLE_PREFIX___users")
  // @@map("BP_PF_v7pp_evaluations") → @@map("__TABLE_PREFIX___v7pp_evaluations")

  schema = schema.replace(
    /@@map\("BP_PF([^"]+)"\)/g,
    '@@map("__TABLE_PREFIX__$1")'
  );

  // Écrire le template
  fs.writeFileSync(TEMPLATE_PATH, schema, 'utf-8');

  console.log(`✅ Template créé: ${TEMPLATE_PATH}`);
  console.log('✅ Remplacements effectués: BP_PF_* → __TABLE_PREFIX___*');

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
