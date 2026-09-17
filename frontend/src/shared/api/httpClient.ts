import { env } from '@/config/env';
import { ApiError, kindFromStatus } from './ApiError';

/**
 * The ONLY place that calls fetch() for the Soraq API.
 *
 * - Same-origin requests with the session cookie (credentials: 'same-origin').
 * - Adds the CSRF token to state-changing requests; refreshes it once if it expired.
 * - Unwraps { data } and converts { error } into ApiError.
 * - Notifies listeners on 401 so the auth layer can react globally.
 *
 * Feature code calls typed functions in features/<name>/api/, never this directly from components.
 */

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

let csrfToken: string | null = null;
const unauthenticatedListeners = new Set<() => void>();

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** Subscribe to "the server says this session is not authenticated". Returns an unsubscribe fn. */
export function onUnauthenticated(listener: () => void): () => void {
  unauthenticatedListeners.add(listener);
  return () => unauthenticatedListeners.delete(listener);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.code === 'csrf_invalid' && !path.startsWith('/auth/session')) {
      await refreshCsrfToken(options.signal);
      return send<T>(path, options);
    }
    throw error;
  }
}

async function refreshCsrfToken(signal?: AbortSignal): Promise<void> {
  const session = await send<{ csrfToken: string }>('/auth/session', { signal });
  setCsrfToken(session.csrfToken);
}

async function send<T>(path: string, { method = 'GET', body, signal }: RequestOptions): Promise<T> {
  // The API localises its messages from Accept-Language (backend/lang). <html lang> is set by I18nProvider.
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': document.documentElement.lang || 'es' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (method !== 'GET' && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : method === 'GET' ? undefined : '{}',
      credentials: 'same-origin',
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError({
      kind: 'network',
      status: 0,
      code: 'network_error',
      message: '', // translated by the UI from kind 'network'
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; fields?: Record<string, string>; requestId?: string } } | null)?.error;
    const apiError = new ApiError({
      kind: kindFromStatus(response.status),
      status: response.status,
      code: error?.code ?? 'unknown_error',
      message: error?.message ?? '',
      fields: error?.fields,
      requestId: error?.requestId,
    });

    // 'invalid_credentials' is also a 401 but is a form error, not a lost session.
    if (apiError.code === 'unauthenticated') {
      unauthenticatedListeners.forEach((listener) => listener());
    }
    throw apiError;
  }

  return (payload as { data: T }).data;
}
