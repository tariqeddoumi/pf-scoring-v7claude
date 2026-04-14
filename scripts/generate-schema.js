#!/usr/bin/env node

/**
 * Script de génération du schéma Prisma avec prefix paramétrable
 *
 * Usage:
 *   TABLE_PREFIX=PF_SCORE npm run generate:schema
 *   TABLE_PREFIX=BP_PF_SCORING npm run generate:schema
 *
 * Ce script génère prisma/schema.prisma à partir du template
 * avec le prefix spécifié en variable d'environnement.
 *
 * Avantages:
 * - Permet de déployer avec différents noms de tables
 * - Configuration centralisée dans .env
 * - Pas de modifications manuelles du schéma
 */

const fs = require('fs');
const path = require('path');

const TABLE_PREFIX = process.env.TABLE_PREFIX || 'BP_PF';

if (!TABLE_PREFIX) {
  console.error('❌ TABLE_PREFIX non défini');
  console.error('Usage: TABLE_PREFIX=PF_SCORE npm run generate:schema');
  process.exit(1);
}

const TEMPLATE_PATH = path.join(__dirname, '../schema.template.prisma');
const OUTPUT_PATH = path.join(__dirname, '../schema.prisma');

try {
  console.log(`📝 Génération du schéma avec prefix: ${TABLE_PREFIX}`);

  // Lire le template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Template non trouvé: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Remplacer les placeholders
  template = template.replace(/__TABLE_PREFIX__/g, TABLE_PREFIX);

  // Écrire le schéma généré
  fs.writeFileSync(OUTPUT_PATH, template, 'utf-8');

  console.log(`✅ Schéma généré: ${OUTPUT_PATH}`);
  console.log(`✅ Tables avec prefix: ${TABLE_PREFIX}_*`);

  // Afficher un exemple des tables générées
  const exampleTables = [
    `${TABLE_PREFIX}_users`,
    `${TABLE_PREFIX}_projects`,
    `${TABLE_PREFIX}_v7pp_evaluations`,
    `${TABLE_PREFIX}_v7pp_scoring_nodes`,
  ];

  console.log('\n📋 Exemple de tables générées:');
  exampleTables.forEach(table => console.log(`   - ${table}`));

} catch (error) {
  console.error('❌ Erreur lors de la génération:', error.message);
  process.exit(1);
}
