import { apiRequest, setCsrfToken } from '@/shared/api/httpClient';
import type { LoginInput, RegisterInput, SessionPayload } from '../model/types';

/** Every auth response carries a (possibly rotated) CSRF token; store it before returning. */
async function withToken(request: Promise<SessionPayload>): Promise<SessionPayload> {
  const payload = await request;
  setCsrfToken(payload.csrfToken);
  return payload;
}

export const authApi = {
  getSession: (signal?: AbortSignal) => withToken(apiRequest<SessionPayload>('/auth/session', { signal })),
  login: (input: LoginInput) => withToken(apiRequest<SessionPayload>('/auth/login', { method: 'POST', body: input })),
  register: (input: RegisterInput) => withToken(apiRequest<SessionPayload>('/auth/register', { method: 'POST', body: input })),
  logout: () => withToken(apiRequest<SessionPayload>('/auth/logout', { method: 'POST' })),
};
