import { config } from './config';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const url = `${config.api.baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
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
