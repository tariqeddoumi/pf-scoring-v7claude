/**
 * Notion API Client for PF Scoring PMO
 * Connects Claude to Notion for automatic tracking updates
 */

import { Client } from "@notionhq/client";

const notionApiKey = process.env.NOTION_API_KEY;

if (!notionApiKey) {
  throw new Error("NOTION_API_KEY not configured in environment variables");
}

export const notion = new Client({
  auth: notionApiKey,
});

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
    console.error(
      "NOTION_DATABASE_ID not configured. Create database first."
    );
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    return response.results.map((page: any) => {
      const properties = page.properties;
      return {
        id: page.id,
        name: properties.Name.title[0]?.plain_text || "",
        bloc: properties.Bloc.select?.name || "",
        statut: properties.Statut.select?.name || "",
        completion: properties["Complétion %"].number || 0,
        description: properties.Description.rich_text[0]?.plain_text || "",
        specification: properties.Spécification.rich_text[0]?.plain_text || "",
        notes: properties.Notes.rich_text[0]?.plain_text || "",
        dateUpdated: properties["Date Maj"].date?.start || "",
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
    const properties: any = {};

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

  const stats = {
    total: items.length,
    integrated: items.filter((i) => i.statut === "INTÉGRÉ").length,
    inProgress: items.filter((i) => i.statut === "EN COURS").length,
    planned: items.filter((i) => i.statut === "PLANIFIÉ").length,
    blocked: items.filter((i) => i.statut === "BLOQUÉ").length,
    averageCompletion:
      items.reduce((sum, i) => sum + i.completion, 0) / items.length || 0,
    byBloc: {} as Record<string, any>,
  };

  // Group by bloc
  items.forEach((item) => {
    if (!stats.byBloc[item.bloc]) {
      stats.byBloc[item.bloc] = {
        total: 0,
        integrated: 0,
        inProgress: 0,
        completion: 0,
      };
    }
    stats.byBloc[item.bloc].total++;
    if (item.statut === "INTÉGRÉ")
      stats.byBloc[item.bloc].integrated++;
    if (item.statut === "EN COURS")
      stats.byBloc[item.bloc].inProgress++;
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
