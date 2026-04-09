import { config } from './config';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  // Get token from cookies on client side
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const url = `${config.api.baseUrl}${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return data;
}

// For handling responses with error codes (like form submissions)
export async function apiFetchWithErrorHandling(endpoint: string, options: FetchOptions = {}) {
  const url = `${config.api.baseUrl}${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
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
