import prisma from "@/lib/prisma-client";

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Create default scoring model if it doesn't exist
    const defaultModel = await prisma.scoringModel.upsert({
      where: { code: "PF_STANDARD_V7PP" },
      update: {},
      create: {
        code: "PF_STANDARD_V7PP",
        label: "Project Finance Standard V7++",
        description:
          "Standard project finance scoring model based on IFC, EBRD, and Basel guidelines",
        businessSegment: "Project Finance",
        projectType: "All",
        status: "DRAFT",
        isActive: true,
      },
    });

    console.log(`✅ Created/updated scoring model: ${defaultModel.code}`);

    // Create initial version
    const initialVersion = await prisma.scoringModelVersion.upsert({
      where: {
        modelId_versionNumber: {
          modelId: defaultModel.id,
          versionNumber: 1,
        },
      },
      update: {},
      create: {
        modelId: defaultModel.id,
        versionNumber: 1,
        label: "Initial Version",
        status: "DRAFT",
        isPublished: false,
        changeReason: "Initial creation",
        createdBy: "system",
      },
    });

    console.log(`✅ Created initial version: v${initialVersion.versionNumber}`);

    // Create 9 domain nodes (V7++ Model)
    const domainCodes = [
      { code: "D1", label: "Sponsor & Shareholders", weight: 0.10 },
      { code: "D2", label: "Project Characteristics", weight: 0.10 },
      { code: "D3", label: "Construction Risk", weight: 0.15 },
      { code: "D4", label: "Market Risk", weight: 0.10 },
      { code: "D5", label: "Operational Risk", weight: 0.10 },
      { code: "D6", label: "Counterparty Risk", weight: 0.10 },
      { code: "D7", label: "Financial Structure & Cash Flow", weight: 0.15 },
      { code: "D8", label: "Legal & Documentation", weight: 0.10 },
      { code: "D9", label: "ESG & Climate Risk", weight: 0.10 },
    ];

    for (let i = 0; i < domainCodes.length; i++) {
      const domain = domainCodes[i];

      await prisma.scoringNode.upsert({
        where: {
          versionId_code: {
            versionId: initialVersion.id,
            code: domain.code,
          },
        },
        update: {},
        create: {
          versionId: initialVersion.id,
          parentNodeId: null,
          nodeType: "DOMAIN",
          code: domain.code,
          label: domain.label,
          description: `Domain ${i + 1}: ${domain.label}`,
          depth: 1,
          orderIndex: i,
          isActive: true,
          isTerminal: false,
          isScored: true,
          weight: domain.weight,
          weightMode: "RELATIVE",
          aggregationMethod: "WEIGHTED_AVERAGE",
        },
      });
    }

    console.log(`✅ Created 9 domain nodes`);
    console.log("\n✨ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
