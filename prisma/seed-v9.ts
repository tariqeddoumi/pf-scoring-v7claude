import { PrismaClient } from "@prisma/client";
import v9Data from "./migrations/v9_source_data.json";

const prisma = new PrismaClient();

const SECTORS = [
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

async function main() {
  console.log("🌱 Starting V9 seed...");

  // 1. Create/update sectors
  console.log("📍 Seeding 12 sectors...");
  const sectorMap: Record<string, string> = {};

  for (const [i, s] of SECTORS.entries()) {
    const sector = await prisma.v9Sector.upsert({
      where: { code: s.code },
      update: { label: s.label, orderIndex: i + 1 },
      create: { code: s.code, label: s.label, orderIndex: i + 1, isActive: true },
    });
    sectorMap[s.code] = sector.id;
    console.log(`  ✓ ${s.code}: ${s.label}`);
  }

  // 2. Seed thresholds (144 total)
  console.log("📊 Seeding 144 thresholds (DSCR/LLCR/LEVERAGE)...");
  let thresholdCount = 0;
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
    thresholdCount++;
  }
  console.log(`  ✓ ${thresholdCount} thresholds created`);

  // 3. Seed red flags (96 total)
  console.log("🚩 Seeding 96 red flags...");
  let redFlagCount = 0;
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
    redFlagCount++;
  }
  console.log(`  ✓ ${redFlagCount} red flags created`);

  // 4. Seed indicators (72 total)
  console.log("📈 Seeding 72 indicators...");
  let indicatorCount = 0;
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
    indicatorCount++;
  }
  console.log(`  ✓ ${indicatorCount} indicators created`);

  // 5. Seed stress tests (24 total)
  console.log("⚡ Seeding 24 stress tests...");
  let stressTestCount = 0;
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
    stressTestCount++;
  }
  console.log(`  ✓ ${stressTestCount} stress tests created`);

  // 6. Seed domain weights (108 total)
  console.log("⚖️  Seeding 108 domain weights...");
  let weightCount = 0;
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
      weightCount++;
    }
  }
  console.log(`  ✓ ${weightCount} domain weights created`);

  // 7. Seed malus/bonus rules
  console.log("📋 Seeding malus/bonus rules...");
  let ruleCount = 0;
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
    ruleCount++;
  }
  console.log(`  ✓ ${ruleCount} malus/bonus rules created`);

  // 8. Seed app configuration
  console.log("⚙️  Seeding app configuration...");
  let configCount = 0;
  for (const c of v9Data.appConfiguration) {
    const cfg = c as any;
    await prisma.appConfiguration.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value },
      create: {
        key: cfg.key,
        value: cfg.value,
        type: cfg.type,
        category: cfg.category,
        description: cfg.description,
        isPublic: cfg.isPublic,
        metadata: cfg.metadata,
      },
    });
    configCount++;
  }
  console.log(`  ✓ ${configCount} configuration keys created`);

  // 9. Create V9 scoring model
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

  // 10. Verify counts
  console.log("\n✅ Data integrity check:");
  const counts = {
    sectors: await prisma.v9Sector.count(),
    thresholds: await prisma.v9SectorThreshold.count(),
    domainWeights: await prisma.v9SectorDomainWeight.count(),
    redFlags: await prisma.v9RedFlag.count(),
    indicators: await prisma.v9Indicator.count(),
    stressTests: await prisma.v9StressTest.count(),
    malusBonus: await prisma.v9MalusBonus.count(),
    appConfig: await prisma.appConfiguration.count(),
    model: await prisma.v9ScoringModel.count(),
  };

  const expected = {
    sectors: 12,
    thresholds: 144,
    domainWeights: 108,
    redFlags: 96,
    indicators: 72,
    stressTests: 24,
    malusBonus: 10,
    appConfig: 9,
    model: 1,
  };

  let allGood = true;
  for (const [key, count] of Object.entries(counts)) {
    const exp = expected[key as keyof typeof expected];
    const status = count === exp ? "✓" : "✗";
    console.log(`  ${status} ${key}: ${count}/${exp}`);
    if (count !== exp) allGood = false;
  }

  if (allGood) {
    console.log("\n🎉 All V9 data successfully seeded!");
  } else {
    console.warn("\n⚠️  Some counts don't match expected values");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
