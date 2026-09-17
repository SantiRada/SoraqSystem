/**
 * Typed access to PUBLIC build-time configuration.
 * The only file allowed to read import.meta.env.
 */
const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const env = {
  siteUrl: trimSlash(import.meta.env.VITE_SITE_URL || 'https://soraq.app'),
  apiBaseUrl: trimSlash(import.meta.env.VITE_API_BASE_URL || '/api'),
  isDev: import.meta.env.DEV,
} as const;
