import { apiRequest, setCsrfToken } from '@/shared/api/httpClient';
import type { AccountUserResponse, BillingOverview, DeleteAccountInput, PasswordInput, ProfileInput } from '../model/types';

/** Endpoints act on the signed-in user only (no ids in URLs). */
export const accountApi = {
  updateProfile: (input: ProfileInput) => apiRequest<AccountUserResponse>('/account', { method: 'PATCH', body: input }),

  /** The server regenerates the session: store the rotated CSRF token. */
  changePassword: async (input: PasswordInput) => {
    const response = await apiRequest<AccountUserResponse>('/account/password', { method: 'POST', body: input });
    if (response.csrfToken) setCsrfToken(response.csrfToken);
    return response;
  },

  updatePreferences: (locale: string) => apiRequest<AccountUserResponse>('/account/preferences', { method: 'PATCH', body: { locale } }),

  deleteAccount: async (input: DeleteAccountInput) => {
    const response = await apiRequest<{ user: null; csrfToken: string }>('/account', { method: 'DELETE', body: input });
    setCsrfToken(response.csrfToken);
  },

  billingOverview: (signal?: AbortSignal) => apiRequest<BillingOverview>('/billing/overview', { signal }),
};
