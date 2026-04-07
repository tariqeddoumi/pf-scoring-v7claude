import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState({ data: null, loading: false, error });
      throw err;
    }
  }, [apiCall]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * useUsers - Hook for user management
 */
export function useUsers(page = 1, limit = 50) {
  const router = useRouter();

  return useApi(async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      router.push('/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  });
}

/**
 * useProjects - Hook for project management
 */
export function useProjects(page = 1, limit = 50, filters?: any) {
  const router = useRouter();
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...filters,
  }).toString();

  return useApi(async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/projects?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      router.push('/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  });
}

/**
 * useEvaluations - Hook for evaluation management
 */
export function useEvaluations(page = 1, limit = 50, filters?: any) {
  const router = useRouter();
  const queryString = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...filters,
  }).toString();

  return useApi(async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`/api/evaluations?${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      router.push('/login');
      throw new Error('Unauthorized');
    }
    if (!response.ok) throw new Error('Failed to fetch evaluations');
    return response.json();
  });
}

/**
 * useMutation - Hook for POST/PUT/DELETE operations
 */
export function useMutation<T = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const router = useRouter();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload?: any) => {
      setState({ data: null, loading: true, error: null });
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: payload ? JSON.stringify(payload) : undefined,
        });

        if (response.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const result = await response.json();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [url, method, router]
  );

  return { ...state, mutate };
}
