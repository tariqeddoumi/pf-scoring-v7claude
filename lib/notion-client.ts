/**
 * Notion API Client for PF Scoring PMO
 * Connects Claude to Notion for automatic tracking updates
 */

type NotionClient = {
  databases: { query: (config: unknown) => Promise<unknown> };
  pages: {
    update: (config: unknown) => Promise<unknown>;
    create: (config: unknown) => Promise<unknown>;
  };
};

let notion: NotionClient | null = null;

try {
  // @ts-expect-error - @notionhq/client is an optional dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require("@notionhq/client") as {
    Client: new (config: { auth: string }) => NotionClient;
  };
  const notionApiKey = process.env.NOTION_API_KEY;

  if (notionApiKey) {
    notion = new Client({
      auth: notionApiKey,
    });
  }
} catch {
  console.warn(
    "Notion client not available - @notionhq/client module not installed"
  );
}

export { notion };

/**
 * Database structure for PMO Tracking
 * This will be created/updated automatically
 */
export const DATABASE_SCHEMA = {
  title: "PF Scoring PMO Tracking",
  parent: {
    type: "workspace",
    workspace: true,
  },
  icon: {
    type: "emoji",
    emoji: "📊",
  },
  cover: {
    type: "external",
    external: {
      url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200",
    },
  },
  properties: {
    Name: {
      title: {},
    },
    Bloc: {
      select: {
        options: [
          { name: "Système & Architecture", color: "blue" },
          { name: "Domaines Scoring", color: "purple" },
          { name: "Règles Métier", color: "pink" },
          { name: "Formulaires", color: "green" },
          { name: "Auth & RBAC", color: "yellow" },
          { name: "Workflow & États", color: "orange" },
          { name: "Pages & Routes", color: "red" },
          { name: "API Routes", color: "gray" },
          { name: "Intégrations", color: "brown" },
          { name: "Conformités", color: "teal" },
          { name: "Cache & Performance", color: "indigo" },
          { name: "Sécurité", color: "cyan" },
          { name: "Tests", color: "lime" },
          { name: "Mobile Responsive", color: "navy" },
          { name: "Déploiement", color: "maroon" },
        ],
      },
    },
    Catégorie: {
      select: {
        options: [
          { name: "Framework", color: "blue" },
          { name: "Database", color: "purple" },
          { name: "Frontend", color: "pink" },
          { name: "Backend", color: "green" },
          { name: "Testing", color: "yellow" },
          { name: "Deployment", color: "orange" },
        ],
      },
    },
    Statut: {
      select: {
        options: [
          { name: "INTÉGRÉ", color: "green" },
          { name: "EN COURS", color: "orange" },
          { name: "PLANIFIÉ", color: "blue" },
          { name: "BLOQUÉ", color: "red" },
        ],
      },
    },
    "Complétion %": {
      number: {
        format: "percent",
      },
    },
    Description: {
      rich_text: {},
    },
    Spécification: {
      rich_text: {},
    },
    Notes: {
      rich_text: {},
    },
    Assigné: {
      people: {},
    },
    "Date Maj": {
      date: {},
    },
    "Type Changement": {
      select: {
        options: [
          { name: "FIX", color: "red" },
          { name: "FEATURE", color: "green" },
          { name: "ENHANCEMENT", color: "blue" },
          { name: "DOCUMENTATION", color: "yellow" },
        ],
      },
    },
  },
};

/**
 * Fetch all tracking items from Notion
 */
export async function getTrackingItems() {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    console.error("NOTION_DATABASE_ID not configured. Create database first.");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    return (response.results as unknown[]).map((page: unknown) => {
      const pageObj = page as Record<string, unknown>;
      const properties = pageObj.properties as Record<string, unknown>;
      return {
        id: pageObj.id,
        name: (properties.Name as Record<string, unknown>).title?.[0]?.plain_text || "",
        bloc: (properties.Bloc as Record<string, unknown>).select?.name || "",
        statut: (properties.Statut as Record<string, unknown>).select?.name || "",
        completion: (properties["Complétion %"] as Record<string, unknown>).number || 0,
        description: (properties.Description as Record<string, unknown>).rich_text?.[0]?.plain_text || "",
        specification: (properties.Spécification as Record<string, unknown>).rich_text?.[0]?.plain_text || "",
        notes: (properties.Notes as Record<string, unknown>).rich_text?.[0]?.plain_text || "",
        dateUpdated: (properties["Date Maj"] as Record<string, unknown>).date?.start || "",
      };
    });
  } catch (error) {
    console.error("Error fetching Notion items:", error);
    return [];
  }
}

/**
 * Update a tracking item in Notion
 */
export async function updateTrackingItem(
  pageId: string,
  updates: {
    statut?: string;
    completion?: number;
    notes?: string;
    dateUpdated?: string;
  }
) {
  try {
    const properties: Record<string, unknown> = {};

    if (updates.statut) {
      properties.Statut = {
        select: { name: updates.statut },
      };
    }

    if (updates.completion !== undefined) {
      properties["Complétion %"] = {
        number: updates.completion,
      };
    }

    if (updates.notes) {
      properties.Notes = {
        rich_text: [{ text: { content: updates.notes } }],
      };
    }

    if (updates.dateUpdated) {
      properties["Date Maj"] = {
        date: { start: updates.dateUpdated },
      };
    }

    return await notion.pages.update({
      page_id: pageId,
      properties,
    });
  } catch (error) {
    console.error("Error updating Notion item:", error);
    throw error;
  }
}

/**
 * Create new tracking item in Notion
 */
export async function createTrackingItem(item: {
  name: string;
  bloc: string;
  categorie: string;
  statut: string;
  completion: number;
  description: string;
  specification: string;
}) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID not configured");
  }

  try {
    return await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [{ text: { content: item.name } }],
        },
        Bloc: {
          select: { name: item.bloc },
        },
        Catégorie: {
          select: { name: item.categorie },
        },
        Statut: {
          select: { name: item.statut },
        },
        "Complétion %": {
          number: item.completion,
        },
        Description: {
          rich_text: [{ text: { content: item.description } }],
        },
        Spécification: {
          rich_text: [{ text: { content: item.specification } }],
        },
        "Date Maj": {
          date: { start: new Date().toISOString().split("T")[0] },
        },
      },
    });
  } catch (error) {
    console.error("Error creating Notion item:", error);
    throw error;
  }
}

/**
 * Get statistics for dashboard generation
 */
export async function getTrackingStats() {
  const items = await getTrackingItems();

  type Item = {
    statut: string;
    completion: number;
    bloc: string;
  };

  const stats = {
    total: items.length,
    integrated: items.filter((i: Item) => i.statut === "INTÉGRÉ").length,
    inProgress: items.filter((i: Item) => i.statut === "EN COURS").length,
    planned: items.filter((i: Item) => i.statut === "PLANIFIÉ").length,
    blocked: items.filter((i: Item) => i.statut === "BLOQUÉ").length,
    averageCompletion:
      items.reduce((sum: number, i: Item) => sum + i.completion, 0) /
        items.length || 0,
    byBloc: {} as Record<string, Record<string, number>>,
  };

  // Group by bloc
  items.forEach((item: Item) => {
    if (!stats.byBloc[item.bloc]) {
      stats.byBloc[item.bloc] = {
        total: 0,
        integrated: 0,
        inProgress: 0,
        completion: 0,
      };
    }
    stats.byBloc[item.bloc].total++;
    if (item.statut === "INTÉGRÉ") stats.byBloc[item.bloc].integrated++;
    if (item.statut === "EN COURS") stats.byBloc[item.bloc].inProgress++;
    stats.byBloc[item.bloc].completion += item.completion;
  });

  // Calculate average per bloc
  Object.keys(stats.byBloc).forEach((bloc) => {
    stats.byBloc[bloc].completion =
      Math.round(
        (stats.byBloc[bloc].completion / stats.byBloc[bloc].total) * 100
      ) / 100;
  });

  return stats;
}
