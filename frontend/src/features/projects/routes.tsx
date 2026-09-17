import type { RouteObject } from 'react-router';

/** Projects list, mounted under /app inside AppLayout (no sidebar). A single project opens the workspace feature. */
export const projectRoutes: RouteObject[] = [
  { path: 'projects', lazy: async () => ({ Component: (await import('./pages/ProjectsPage')).ProjectsPage }) },
];
