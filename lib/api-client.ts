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

export async function apiPatch(url: string, body?: any, options?: RequestInit) {
  return apiCall(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(url: string, options?: RequestInit) {
  return apiCall(url, { ...options, method: 'DELETE' });
}

/**
 * Message d'erreur exploitable pour une réponse en échec.
 *
 * Les écrans affichaient « Chargement impossible » sans jamais lire ce que le serveur
 * répondait : une limite de pagination refusée, un droit manquant et une panne de
 * base se lisaient tous de la même façon, et il fallait ouvrir la console pour
 * distinguer les trois.
 */
export async function messageErreurApi(
  res: Response,
  parDefaut = "Chargement impossible."
): Promise<string> {
  if (res.status === 401) return "Votre session a expiré : reconnectez-vous.";
  if (res.status === 403) return "Vos droits ne permettent pas cette consultation.";
  try {
    const corps = await res.json();
    const detail =
      corps?.error ??
      corps?.message ??
      (Array.isArray(corps?.errors)
        ? corps.errors.map((e: { message?: string }) => e.message).join(" — ")
        : null);
    if (typeof detail === "string" && detail.trim()) {
      return `${parDefaut} ${detail}`;
    }
  } catch {
    /* corps illisible : le message générique suffit */
  }
  return `${parDefaut} (erreur ${res.status})`;
}
