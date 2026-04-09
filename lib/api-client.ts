import { config } from './config';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

function getApiUrl(endpoint: string): string {
  // Use relative URL for same-origin requests
  // This works on all deployments without env var configuration
  return endpoint;
}

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const url = getApiUrl(endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // Include cookies in request for authentication
    credentials: 'include'
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return data;
}

// For handling responses with error codes (like form submissions)
export async function apiFetchWithErrorHandling(endpoint: string, options: FetchOptions = {}) {
  const url = getApiUrl(endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // Include cookies in request for authentication
    credentials: 'include'
  });
  return {
    ok: response.ok,
    data: await response.json()
  };
}

export const api = {
  evaluations: {
    list: () => apiFetch('/evaluations'),
    create: (data: any) => apiFetch('/evaluations', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => apiFetch(`/evaluations/${id}`),
    update: (id: string, data: any) => apiFetch(`/evaluations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/evaluations/${id}`, { method: 'DELETE' }),
  },
  projects: {
    list: () => apiFetch('/projects'),
    create: (data: any) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  },
  clients: {
    list: () => apiFetch('/clients'),
    create: (data: any) => apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    list: () => apiFetch('/users'),
    create: (data: any) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  },
};
