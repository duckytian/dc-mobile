import { API_BASE_URL } from './config';
import { tokenStore } from './token-store';

/**
 * Every backend route is mounted under `/api` (see backend/api/routes/index.ts).
 * Older call sites pass both `/dashboard/summary` (no prefix) and
 * `/api/auth/login` (with prefix); normalize once here so all requests share a
 * single source of truth, the same convention as the web app's httpClient.
 */
function normalizePath(path: string): string {
  const stripped = path.startsWith('/api/') ? path.slice(4) : path;
  return `/api${stripped.startsWith('/') ? '' : '/'}${stripped}`;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ErrorPayload = {
  success?: boolean;
  code?: string;
  message?: string;
  details?: unknown;
};

let refreshing: Promise<boolean> | null = null;

async function toApiError(res: Response): Promise<ApiError> {
  let payload: ErrorPayload | undefined;
  try {
    payload = (await res.json()) as ErrorPayload;
  } catch {
    payload = undefined;
  }
  return new ApiError(
    res.status,
    payload?.code ?? 'REQUEST_FAILED',
    payload?.message ?? `Request failed (${res.status})`,
    payload?.details ?? payload
  );
}

async function refreshTokens(): Promise<boolean> {
  if (refreshing) {
    return refreshing;
  }

  const refreshToken = tokenStore.refresh;
  if (!refreshToken) {
    return false;
  }

  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${normalizePath('/auth/refresh')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });

      if (!res.ok) {
        return false;
      }

      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };

      if (data?.accessToken) {
        await tokenStore.set(data.accessToken, data.refreshToken ?? refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = tokenStore.access;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include'
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
    await tokenStore.clear();
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path)
};