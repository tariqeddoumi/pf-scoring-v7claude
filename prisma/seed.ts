import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create scoring domains
  const domains = await Promise.all([
    prisma.scoreDomain.upsert({
      where: { code: "financier" },
      update: {},
      create: {
        code: "financier",
        label: "Risque Financier",
        description:
          "Analyse de la situation financière et de la capacité de remboursement",
        weight: 0.25,
        orderIndex: 1,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "technique" },
      update: {},
      create: {
        code: "technique",
        label: "Risque Technique",
        description: "Évaluation de la faisabilité technique du projet",
        weight: 0.15,
        orderIndex: 2,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "marche" },
      update: {},
      create: {
        code: "marche",
        label: "Risque de Marché",
        description: "Analyse du marché et de la demande",
        weight: 0.15,
        orderIndex: 3,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "environnemental" },
      update: {},
      create: {
        code: "environnemental",
        label: "Risque Environnemental",
        description: "Conformité IFC et impact environnemental",
        weight: 0.1,
        orderIndex: 4,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "social" },
      update: {},
      create: {
        code: "social",
        label: "Risque Social",
        description: "Conformité EBRD et impact social",
        weight: 0.1,
        orderIndex: 5,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "gouvernance" },
      update: {},
      create: {
        code: "gouvernance",
        label: "Risque de Gouvernance",
        description: "Gouvernance d'entreprise et conformité",
        weight: 0.1,
        orderIndex: 6,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "juridique" },
      update: {},
      create: {
        code: "juridique",
        label: "Risque Juridique",
        description: "Cadre juridique et réglementaire",
        weight: 0.08,
        orderIndex: 7,
        isActive: true,
      },
    }),
    prisma.scoreDomain.upsert({
      where: { code: "pays" },
      update: {},
      create: {
        code: "pays",
        label: "Risque Pays",
        description: "Risque de pays et stabilité politique",
        weight: 0.07,
        orderIndex: 8,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${domains.length} domains`);

  // Create criteria for each domain
  for (const domain of domains) {
    if (domain.code === "financier") {
      await createFinancialCriteria(domain.id);
    } else if (domain.code === "technique") {
      await createTechnicalCriteria(domain.id);
    } else if (domain.code === "marche") {
      await createMarketCriteria(domain.id);
    } else if (domain.code === "environnemental") {
      await createEnvironmentalCriteria(domain.id);
    } else if (domain.code === "social") {
      await createSocialCriteria(domain.id);
    } else if (domain.code === "gouvernance") {
      await createGovernanceCriteria(domain.id);
    } else if (domain.code === "juridique") {
      await createLegalCriteria(domain.id);
    } else if (domain.code === "pays") {
      await createCountryCriteria(domain.id);
    }
  }

  // Create countries with risk scores
  await createCountries();

  // Create default users
  await createUsers();

  // Create system configuration
  await createSystemConfig();

  console.log("🌱 Seed completed successfully!");
}

async function createFinancialCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "endettement" } },
    update: {},
    create: {
      domainId,
      code: "endettement",
      label: "Ratio d'endettement",
      description: "Ratio d'endettement par rapport aux fonds propres",
      type: "RANGE",
      orderIndex: 1,
    },
  });

  await prisma.scoreRange.createMany({
    data: [
      {
        criterionId: criterion.id,
        minValue: 0,
        maxValue: 1,
        score: 100,
        label: "Très faible",
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        minValue: 1,
        maxValue: 2,
        score: 80,
        label: "Faible",
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        minValue: 2,
        maxValue: 3,
        score: 60,
        label: "Modéré",
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        minValue: 3,
        maxValue: 5,
        score: 40,
        label: "Élevé",
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        minValue: 5,
        maxValue: 10,
        score: 20,
        label: "Très élevé",
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createTechnicalCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "faisabilite" } },
    update: {},
    create: {
      domainId,
      code: "faisabilite",
      label: "Faisabilité technique",
      description: "Niveau de faisabilité technique du projet",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Éprouvée et testée",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Bien documentée",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Nouvelle mais prometteuse",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Expérimentale",
        score: 40,
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        label: "Non testée",
        score: 20,
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createMarketCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "demande" } },
    update: {},
    create: {
      domainId,
      code: "demande",
      label: "Demande du marché",
      description: "Niveau de demande pour le produit/service",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Très forte et confirmée",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Forte",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Modérée",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Faible",
        score: 40,
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        label: "Très faible ou incertaine",
        score: 20,
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createEnvironmentalCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "conformite_ifc" } },
    update: {},
    create: {
      domainId,
      code: "conformite_ifc",
      label: "Conformité IFC",
      description: "Respect des standards de Performance Standards de l'IFC",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Catégorie A - Conforme",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Catégorie B - Conforme avec mesures",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Catégorie C - À améliorer",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Non conforme",
        score: 20,
        orderIndex: 4,
      },
    ],
    skipDuplicates: true,
  });
}

async function createSocialCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "conformite_ebrd" } },
    update: {},
    create: {
      domainId,
      code: "conformite_ebrd",
      label: "Conformité EBRD",
      description:
        "Respect des Environmental and Social Policy de la EBRD",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Excellent",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Bon",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Satisfaisant",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Faible",
        score: 40,
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        label: "Non conforme",
        score: 20,
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createGovernanceCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "gouvernance" } },
    update: {},
    create: {
      domainId,
      code: "gouvernance",
      label: "Qualité de gouvernance",
      description: "Qualité de la gouvernance d'entreprise",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Excellente - Best practice",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Bonne",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Adéquate",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Faible",
        score: 40,
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        label: "Très faible",
        score: 20,
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createLegalCriteria(domainId: string) {
  const criterion = await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "cadre_juridique" } },
    update: {},
    create: {
      domainId,
      code: "cadre_juridique",
      label: "Cadre juridique",
      description: "Cadre juridique et clarté réglementaire",
      type: "OPTION",
      orderIndex: 1,
    },
  });

  await prisma.scoreOption.createMany({
    data: [
      {
        criterionId: criterion.id,
        label: "Bien établi et clair",
        score: 100,
        orderIndex: 1,
      },
      {
        criterionId: criterion.id,
        label: "Etabli",
        score: 80,
        orderIndex: 2,
      },
      {
        criterionId: criterion.id,
        label: "Partiellement clair",
        score: 60,
        orderIndex: 3,
      },
      {
        criterionId: criterion.id,
        label: "Flou ou contestable",
        score: 40,
        orderIndex: 4,
      },
      {
        criterionId: criterion.id,
        label: "Très incertain",
        score: 20,
        orderIndex: 5,
      },
    ],
    skipDuplicates: true,
  });
}

async function createCountryCriteria(domainId: string) {
  await prisma.scoreCriterion.upsert({
    where: { domainId_code: { domainId, code: "risque_pays" } },
    update: {},
    create: {
      domainId,
      code: "risque_pays",
      label: "Risque Pays",
      description: "Risque associé au pays de localisation du projet",
      type: "OPTION",
      orderIndex: 1,
    },
  });
}

async function createCountries() {
  const countries = [
    { code: "MA", label: "Maroc", riskScore: 45.0 },
    { code: "DZ", label: "Algérie", riskScore: 55.0 },
    { code: "TN", label: "Tunisie", riskScore: 48.0 },
    { code: "LY", label: "Libye", riskScore: 75.0 },
    { code: "MR", label: "Mauritanie", riskScore: 65.0 },
    { code: "SN", label: "Sénégal", riskScore: 50.0 },
    { code: "NG", label: "Nigeria", riskScore: 62.0 },
    { code: "GH", label: "Ghana", riskScore: 48.0 },
    { code: "FR", label: "France", riskScore: 25.0 },
    { code: "ES", label: "Espagne", riskScore: 30.0 },
    { code: "PT", label: "Portugal", riskScore: 28.0 },
    { code: "DE", label: "Allemagne", riskScore: 22.0 },
    { code: "IT", label: "Italie", riskScore: 35.0 },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: { riskScore: country.riskScore },
      create: country,
    });
  }

  console.log(`✅ Created ${countries.length} countries`);
}

async function createUsers() {
  const users = [
    {
      email: "admin@pf-scoring.ma",
      password: "Admin123!",
      nom: "Admin",
      prenom: "Utilisateur",
      role: "admin",
    },
    {
      email: "analyst@pf-scoring.ma",
      password: "Analyst123!",
      nom: "Analyst",
      prenom: "Test",
      role: "analyst",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcryptjs.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nom: user.nom,
        prenom: user.prenom,
        role: user.role as any,
      },
      create: {
        email: user.email,
        password: hashedPassword,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role as any,
      },
    });
  }

  console.log(`✅ Created default users`);
}

async function createSystemConfig() {
  const configs = [
    {
      key: "COUNTRY_RISK_MODE",
      value: "AUTO_ASSIGN",
      description:
        "Mode for country risk: AUTO_ASSIGN (from country) or MANUAL (user input)",
    },
    {
      key: "ACTIVE_DOMAINS",
      value:
        "financier,technique,marche,environnemental,social,gouvernance,juridique,pays",
      description: "Comma-separated list of active scoring domains",
    },
    {
      key: "AUTH_ENABLED_METHODS",
      value: "password",
      description: "Enabled authentication methods: password,oauth,saml",
    },
    {
      key: "PASSWORD_MIN_LENGTH",
      value: "8",
      description: "Minimum password length",
    },
    {
      key: "SESSION_TIMEOUT_MINUTES",
      value: "120",
      description: "Session timeout in minutes",
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log(`✅ Created ${configs.length} system configurations`);
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
