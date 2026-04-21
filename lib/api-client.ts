/**
 * Client HTTP pour les appels API côté navigateur.
 *
 * FONCTIONNEMENT (pour débutants) :
 * -------------------------------------------
 * Toutes les pages qui ont besoin de données appellent des fonctions de ce fichier.
 * Ce fichier ajoute automatiquement le token d'authentification à chaque requête
 * afin que le serveur puisse savoir qui fait l'appel.
 *
 * Le token est stocké dans un cookie "auth_token" (mis en place lors du login).
 *
 * UTILISATION TYPIQUE dans une page React :
 *   const projects = await api.projects.list();
 *   const evaluation = await api.evaluations.get("some-id");
 */

// ============================================================================
// UTILITAIRES INTERNES
// ============================================================================

/**
 * Lit le token JWT depuis le cookie "auth_token" du navigateur.
 * Retourne null si on est côté serveur (SSR) ou si le cookie n'existe pas.
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null; // Pas de window en SSR

  for (const cookie of document.cookie.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name === "auth_token") {
      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Construit les headers communs à toutes les requêtes API :
 * - Content-Type: application/json
 * - Authorization: Bearer <token> (si connecté)
 */
function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================================
// FONCTION FETCH DE BASE
// ============================================================================

/**
 * Effectue un appel API et retourne les données JSON.
 * Lance une erreur si la réponse HTTP n'est pas 2xx.
 *
 * Pour les cas où on veut inspecter le statut HTTP soi-même
 * (ex: gestion des erreurs de validation), utiliser apiFetchRaw().
 */
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(endpoint, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>),
    credentials: "include", // Envoyer aussi les cookies (session Supabase)
  });

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status} : ${response.statusText}`);
  }

  return response.json();
}

/**
 * Variante de apiFetch qui NE lance PAS d'erreur sur les statuts 4xx/5xx.
 * Utile pour les formulaires : on veut afficher les erreurs de validation (400)
 * sans que le catch() attrape tout.
 *
 * Retourne { ok: boolean, data: any } où ok = response.ok.
 */
export async function apiFetchWithErrorHandling(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data: unknown }> {
  const response = await fetch(endpoint, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>),
    credentials: "include",
  });

  return {
    ok: response.ok,
    data: await response.json(),
  };
}

// ============================================================================
// API STRUCTURÉE PAR ENTITÉ
// ============================================================================

/**
 * Objet central d'accès aux endpoints API.
 * Chaque entité expose les opérations CRUD qu'elle supporte.
 */
export const api = {
  // ----- Évaluations -----
  evaluations: {
    list: () =>
      apiFetch("/api/evaluations"),
    get: (id: string) =>
      apiFetch(`/api/evaluations/${id}`),
    create: (data: unknown) =>
      apiFetch("/api/evaluations", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      apiFetch(`/api/evaluations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch(`/api/evaluations/${id}`, { method: "DELETE" }),
  },

  // ----- Projets -----
  projects: {
    list: () =>
      apiFetch("/api/projects"),
    get: (id: string) =>
      apiFetch(`/api/projects/${id}`),
    create: (data: unknown) =>
      apiFetch("/api/projects", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      apiFetch(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch(`/api/projects/${id}`, { method: "DELETE" }),
  },

  // ----- Clients -----
  clients: {
    list: () =>
      apiFetch("/api/clients"),
    get: (id: string) =>
      apiFetch(`/api/clients/${id}`),
    create: (data: unknown) =>
      apiFetch("/api/clients", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      apiFetch(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch(`/api/clients/${id}`, { method: "DELETE" }),
  },

  // ----- Utilisateurs -----
  users: {
    list: () =>
      apiFetch("/api/users"),
    get: (id: string) =>
      apiFetch(`/api/users/${id}`),
    create: (data: unknown) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      apiFetch(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
};
