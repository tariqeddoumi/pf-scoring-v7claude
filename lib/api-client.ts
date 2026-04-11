import { config } from "./config";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  // Only run in browser environment
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
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

function getApiUrl(endpoint: string): string {
  // Use relative URL for same-origin requests
  return endpoint;
}

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Bearer token to Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Check if response is OK before parsing JSON
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// For handling responses with error codes (like form submissions)
export async function apiFetchWithErrorHandling(
  endpoint: string,
  options: FetchOptions = {}
) {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Bearer token to Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  return {
    ok: response.ok,
    data: await response.json(),
  };
}

export const api = {
  evaluations: {
    list: () => apiFetch("/api/evaluations"),
    create: (data: any) =>
      apiFetch("/api/evaluations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id: string) => apiFetch(`/api/evaluations/${id}`),
    update: (id: string, data: any) =>
      apiFetch(`/api/evaluations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch(`/api/evaluations/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: () => apiFetch("/api/projects"),
    create: (data: any) =>
      apiFetch("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  },
  clients: {
    list: () => apiFetch("/api/clients"),
    create: (data: any) =>
      apiFetch("/api/clients", { method: "POST", body: JSON.stringify(data) }),
  },
  users: {
    list: () => apiFetch("/api/users"),
    create: (data: any) =>
      apiFetch("/api/users", { method: "POST", body: JSON.stringify(data) }),
  },
};
