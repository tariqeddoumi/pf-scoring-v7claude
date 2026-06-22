/**
 * Complete Seed Script
 * Initializes entire system: V9 sectors, form configurations, app config, reference data
 * Idempotent: safe to run multiple times
 */

import { PrismaClient } from "@prisma/client";
import v9Data from "./migrations/v9_source_data.json";
// Single source of truth for form configuration. Field names here map 1:1 to
// the Project model / validation schema (see lib/field-config.ts header).
import { PROJECT_SECTIONS } from "../lib/field-config";

const prisma = new PrismaClient();

// V9 Sectors definition
const V9_SECTORS = [
  { code: "ENR", label: "Énergies renouvelables" },
  { code: "EAU", label: "Eau / Dessalement" },
  { code: "TRA", label: "Transport / Autoroutes" },
  { code: "POR", label: "Ports / Logistique" },
  { code: "IND", label: "Industrie / Manufacturing" },
  { code: "MIN", label: "Mines / Extraction" },
  { code: "TOU", label: "Tourisme / Hôtellerie" },
  { code: "TEL", label: "Télécom / Data Centers" },
  { code: "SAN", label: "Santé / Cliniques" },
  { code: "AGR", label: "Agro-industrie" },
  { code: "ETH", label: "Énergie thermique / Gaz" },
  { code: "IMM", label: "Immobilier / Promotion structurée" },
];

async function seedV9Data() {
  console.log("\n🌱 SEED V9: Sectorial Data (12 sectors + 360 records)");

  const sectorMap: Record<string, string> = {};

  // 1. Sectors (12)
  console.log("📍 Seeding V9 sectors...");
  for (const [i, s] of V9_SECTORS.entries()) {
    const sector = await prisma.v9Sector.upsert({
      where: { code: s.code },
      update: { label: s.label, orderIndex: i + 1 },
      create: { code: s.code, label: s.label, orderIndex: i + 1, isActive: true },
    });
    sectorMap[s.code] = sector.id;
    console.log(`  ✓ ${s.code}: ${s.label}`);
  }

  // 2. Thresholds (144: 12 sectors × 3 ratios × 4 levels)
  console.log("📊 Seeding V9 thresholds (144)...");
  for (const t of v9Data.thresholds) {
    const threshold = t as any;
    await prisma.v9SectorThreshold.upsert({
      where: {
        sectorId_ratioType_level: {
          sectorId: sectorMap[threshold.sector],
          ratioType: threshold.ratioType,
          level: threshold.level,
        },
      },
      update: {
        minValue: threshold.min,
        maxValue: threshold.max,
        score: threshold.score,
      },
      create: {
        sectorId: sectorMap[threshold.sector],
        ratioType: threshold.ratioType,
        level: threshold.level,
        minValue: threshold.min,
        maxValue: threshold.max,
        score: threshold.score,
      },
    });
  }
  console.log("  ✓ 144 thresholds created");

  // 3. Red Flags (96: 8 per sector)
  console.log("🚩 Seeding V9 red flags (96)...");
  for (const r of v9Data.redFlags) {
    const rf = r as any;
    await prisma.v9RedFlag.upsert({
      where: {
        sectorId_code: {
          sectorId: sectorMap[rf.sector],
          code: rf.code,
        },
      },
      update: {
        description: rf.description,
        isNoGo: rf.isNoGo,
        penalty: rf.penalty,
        orderIndex: rf.order,
      },
      create: {
        sectorId: sectorMap[rf.sector],
        code: rf.code,
        description: rf.description,
        isNoGo: rf.isNoGo,
        penalty: rf.penalty,
        orderIndex: rf.order,
      },
    });
  }
  console.log("  ✓ 96 red flags created");

  // 4. Indicators (72: 6 per sector)
  console.log("📈 Seeding V9 indicators (72)...");
  for (const ind of v9Data.indicators) {
    const indicator = ind as any;
    await prisma.v9Indicator.upsert({
      where: {
        sectorId_code: {
          sectorId: sectorMap[indicator.sector],
          code: indicator.code,
        },
      },
      update: {
        label: indicator.label,
        unit: indicator.unit,
        targetValue: indicator.targetValue,
        direction: indicator.direction,
        orderIndex: indicator.order,
      },
      create: {
        sectorId: sectorMap[indicator.sector],
        code: indicator.code,
        label: indicator.label,
        unit: indicator.unit,
        targetValue: indicator.targetValue,
        direction: indicator.direction,
        orderIndex: indicator.order,
      },
    });
  }
  console.log("  ✓ 72 indicators created");

  // 5. Stress Tests (24: 2 per sector)
  console.log("⚡ Seeding V9 stress tests (24)...");
  for (const st of v9Data.stressTests) {
    const test = st as any;
    await prisma.v9StressTest.upsert({
      where: {
        sectorId_code: {
          sectorId: sectorMap[test.sector],
          code: test.code,
        },
      },
      update: {
        description: test.description,
        variable: test.variable,
        shockPct: test.shockPct,
        passDscrMin: test.passDscrMin,
        orderIndex: test.order,
      },
      create: {
        sectorId: sectorMap[test.sector],
        code: test.code,
        description: test.description,
        variable: test.variable,
        shockPct: test.shockPct,
        passDscrMin: test.passDscrMin,
        orderIndex: test.order,
      },
    });
  }
  console.log("  ✓ 24 stress tests created");

  // 6. Domain Weights (108: 12 sectors × 9 domains)
  console.log("⚖️  Seeding V9 domain weights (108)...");
  const domainWeights = v9Data.domainWeights as Record<string, Record<string, number>>;
  for (const [sectorCode, domains] of Object.entries(domainWeights)) {
    for (const [domainCode, weight] of Object.entries(domains)) {
      await prisma.v9SectorDomainWeight.upsert({
        where: {
          sectorId_domainCode: {
            sectorId: sectorMap[sectorCode],
            domainCode: domainCode,
          },
        },
        update: { weightAdjusted: weight as number },
        create: {
          sectorId: sectorMap[sectorCode],
          domainCode: domainCode,
          weightAdjusted: weight as number,
        },
      });
    }
  }
  console.log("  ✓ 108 domain weights created");

  // 7. Malus/Bonus (10)
  console.log("📋 Seeding V9 malus/bonus rules (10)...");
  for (const m of v9Data.malusBonus) {
    const rule = m as any;
    await prisma.v9MalusBonus.upsert({
      where: { code: rule.code },
      update: {
        scope: rule.scope,
        domainCode: rule.domainCode,
        kind: rule.kind,
        condition: rule.condition,
        magnitude: rule.magnitude,
        orderIndex: rule.order,
      },
      create: {
        code: rule.code,
        scope: rule.scope,
        domainCode: rule.domainCode,
        kind: rule.kind,
        condition: rule.condition,
        magnitude: rule.magnitude,
        orderIndex: rule.order,
      },
    });
  }
  console.log("  ✓ 10 malus/bonus rules created");

  // 8. V9 Scoring Model
  console.log("🎯 Creating V9 scoring model...");
  const model = await prisma.v9ScoringModel.upsert({
    where: { version: "9.0.0" },
    update: { toolName: "PF Scoring", isActive: true },
    create: {
      version: "9.0.0",
      toolName: "PF Scoring",
      description: "Modèle V9 avec socle V7++ + 12 couches sectorelles",
      socleVersion: "V7++",
      isActive: true,
    },
  });
  console.log(`  ✓ V9 model v${model.version} created/updated`);
}

async function seedFormConfiguration() {
  console.log("\n📋 SEED FORMS: Project Form Configuration (8 sections + 30+ fields)");

  console.log("🔧 Seeding project form sections & fields...");

  for (const section of PROJECT_SECTIONS) {
    const formSection = await prisma.formSection.upsert({
      where: { entity_title: { entity: "project", title: section.title } },
      update: {
        description: section.description,
        icon: section.icon,
        columns: section.columns || 2,
        orderIndex: PROJECT_SECTIONS.indexOf(section),
        layout: "tabs",
        visible: true,
      },
      create: {
        entity: "project",
        title: section.title,
        description: section.description,
        icon: section.icon,
        columns: section.columns || 2,
        orderIndex: PROJECT_SECTIONS.indexOf(section),
        layout: "tabs",
        visible: true,
      },
    });

    for (const field of section.fields) {
      await prisma.fieldConfiguration.upsert({
        where: { entity_fieldName: { entity: "project", fieldName: field.name } },
        update: {
          label: field.label,
          fieldType: field.type,
          required: field.required || false,
          placeholder: field.placeholder,
          helpText: field.help,
          validation: field.validation,
          step: field.step?.toString(),
          orderIndex: section.fields.indexOf(field),
          visible: true,
          editable: true,
          sectionId: formSection.id,
          // Store the option array as real JSON (the form-config API reads it
          // back with Array.isArray); undefined leaves the column untouched.
          customOptions: field.options ?? undefined,
        },
        create: {
          entity: "project",
          sectionId: formSection.id,
          fieldName: field.name,
          label: field.label,
          fieldType: field.type,
          required: field.required || false,
          placeholder: field.placeholder,
          helpText: field.help,
          validation: field.validation,
          step: field.step?.toString(),
          orderIndex: section.fields.indexOf(field),
          visible: true,
          editable: true,
          customOptions: field.options ?? undefined,
        },
      });
    }

    console.log(`  ✓ Section: ${section.title} (${section.fields.length} fields)`);
  }

  const sectionCount = await prisma.formSection.count({ where: { entity: "project" } });
  const fieldCount = await prisma.fieldConfiguration.count({ where: { entity: "project" } });
  console.log(`  ✓ Total: ${sectionCount} sections, ${fieldCount} fields`);
}

async function seedAppConfiguration() {
  console.log("\n⚙️  SEED CONFIG: Application Configuration");

  const configs = [
    {
      key: "SCORING_SECTORIAL_ENABLED",
      value: "false",
      type: "bool",
      category: "scoring",
      description:
        "Réintégrer le calibrage sectoriel dans le score global (ON = poids sectoriels + red flags/no-go + stress + malus/bonus ; OFF = socle V7++ seul)",
      isPublic: false,
    },
    {
      key: "SCORING_DOMAIN_GRANULARITY",
      value: "{}",
      type: "json",
      category: "scoring",
      description:
        "Niveau de saisie du score par domaine : map { domainCode: DOMAIN|CRITERION|SUB_CRITERION }. Vide = niveau par défaut du nœud.",
      isPublic: false,
    },
    {
      key: "SCREENS_DYNAMIC_FORMS_ENABLED",
      value: "false",
      type: "bool",
      category: "screens",
      description:
        "Rendre les écrans Signalétique/Projet à partir de la configuration de champs (FieldConfiguration) au lieu du formulaire codé en dur",
      isPublic: true,
    },
  ];

  for (const cfg of configs) {
    await prisma.appConfiguration.upsert({
      where: { key: cfg.key },
      update: {
        value: cfg.value,
        isPublic: cfg.isPublic,
      },
      create: cfg as any,
    });
    console.log(
      `  ✓ ${cfg.key} (${cfg.isPublic ? "public" : "private"})`
    );
  }
}

async function verifySeeding() {
  console.log("\n✅ DATA INTEGRITY CHECK");

  const counts = {
    v9Sectors: await prisma.v9Sector.count(),
    v9Thresholds: await prisma.v9SectorThreshold.count(),
    v9DomainWeights: await prisma.v9SectorDomainWeight.count(),
    v9RedFlags: await prisma.v9RedFlag.count(),
    v9Indicators: await prisma.v9Indicator.count(),
    v9StressTests: await prisma.v9StressTest.count(),
    v9MalusBonus: await prisma.v9MalusBonus.count(),
    v9Models: await prisma.v9ScoringModel.count(),
    formSections: await prisma.formSection.count({ where: { entity: "project" } }),
    fieldConfigs: await prisma.fieldConfiguration.count({ where: { entity: "project" } }),
    appConfigs: await prisma.appConfiguration.count(),
  };

  const expected = {
    v9Sectors: 12,
    v9Thresholds: 144,
    v9DomainWeights: 108,
    v9RedFlags: 96,
    v9Indicators: 72,
    v9StressTests: 24,
    v9MalusBonus: 10,
    v9Models: 1,
    formSections: 6,
    fieldConfigs: 28,
    appConfigs: 3,
  };

  let allGood = true;
  for (const [key, count] of Object.entries(counts)) {
    const exp = expected[key as keyof typeof expected];
    const status = count >= exp ? "✓" : "✗";
    console.log(`  ${status} ${key}: ${count}/${exp}`);
    if (count < exp) allGood = false;
  }

  if (allGood) {
    console.log("\n🎉 All data successfully seeded and aligned!");
  } else {
    console.warn("\n⚠️  Some counts below expected values - check for errors above");
  }
}

async function main() {
  try {
    console.log("🚀 STARTING COMPLETE ALIGNMENT SEED");
    console.log("═".repeat(60));

    await seedV9Data();
    await seedFormConfiguration();
    await seedAppConfiguration();
    await verifySeeding();

    console.log("\n" + "═".repeat(60));
    console.log("✨ Complete seed finished successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
