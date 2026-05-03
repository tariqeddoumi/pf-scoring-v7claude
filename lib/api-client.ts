/**
 * Client HTTP centralisé pour les appels API
 * Ajoute automatiquement le header Authorization avec le JWT
 */

export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export async function apiGet(url: string, options?: RequestInit) {
  return apiCall(url, { ...options, method: 'GET' });
}

export async function apiPost(url: string, body?: any, options?: RequestInit) {
  return apiCall(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut(url: string, body?: any, options?: RequestInit) {
  return apiCall(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(url: string, options?: RequestInit) {
  return apiCall(url, { ...options, method: 'DELETE' });
}
