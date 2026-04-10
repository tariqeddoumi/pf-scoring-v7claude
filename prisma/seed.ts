import prisma from '@/lib/prisma-client';

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create default scoring model if it doesn't exist
    const defaultModel = await prisma.scoringModel.upsert({
      where: { code: 'PF_STANDARD_V7PP' },
      update: {},
      create: {
        code: 'PF_STANDARD_V7PP',
        label: 'Project Finance Standard V7++',
        description: 'Standard project finance scoring model based on IFC, EBRD, and Basel guidelines',
        businessSegment: 'Project Finance',
        projectType: 'All',
        status: 'DRAFT',
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
        label: 'Initial Version',
        status: 'DRAFT',
        isPublished: false,
        changeReason: 'Initial creation',
        createdBy: 'system',
      },
    });

    console.log(`✅ Created initial version: v${initialVersion.versionNumber}`);

    // Create 8 domain nodes
    const domainCodes = [
      { code: 'D1', label: 'Financial Analysis', weight: 0.25 },
      { code: 'D2', label: 'Technical Analysis', weight: 0.20 },
      { code: 'D3', label: 'Market & Revenue', weight: 0.20 },
      { code: 'D4', label: 'Environmental (IFC)', weight: 0.10 },
      { code: 'D5', label: 'Social (EBRD)', weight: 0.10 },
      { code: 'D6', label: 'Governance', weight: 0.05 },
      { code: 'D7', label: 'Legal & Regulatory', weight: 0.05 },
      { code: 'D8', label: 'Country Risk', weight: 0.05 },
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
          nodeType: 'DOMAIN',
          code: domain.code,
          label: domain.label,
          description: `Domain ${i + 1}: ${domain.label}`,
          depth: 1,
          orderIndex: i,
          isActive: true,
          isTerminal: false,
          isScored: true,
          weight: domain.weight,
          weightMode: 'RELATIVE',
          aggregationMethod: 'WEIGHTED_AVERAGE',
        },
      });
    }

    console.log(`✅ Created 8 domain nodes`);
    console.log('\n✨ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
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
