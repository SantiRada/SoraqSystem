import type { RouteObject } from 'react-router';

/** Public, indexable pages. Every page added here must also be added to public/sitemap.xml. */
export const marketingRoutes: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('./pages/HomePage')).HomePage }) },
];
