import type { RouteObject } from 'react-router';

/**
 * Auth pages (rendered inside AuthLayout by the app router).
 * Pages are lazy-loaded: each feature ships as its own chunk.
 */
export const authRoutes: RouteObject[] = [
  { path: 'login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }) },
  { path: 'register', lazy: async () => ({ Component: (await import('./pages/RegisterPage')).RegisterPage }) },
];
