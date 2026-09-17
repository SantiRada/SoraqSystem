import type { RouteObject } from 'react-router';

/**
 * /app/shared/card-sorting/:studyId   read-only access for designers a study was shared with (inside AppLayout).
 * The project-scoped pages are mounted by features/workspace (Navegación → Card Sorting).
 */
export const cardSortingRoutes: RouteObject[] = [
  { path: 'shared/card-sorting/:studyId', lazy: async () => ({ Component: (await import('./pages/SharedStudyPage')).SharedStudyPage }) },
];

/** Public participant flow, outside every app layout: /cardsorting/:projectSlug/:code (noindex). */
export const participantRoutes: RouteObject[] = [
  { path: 'cardsorting/:projectSlug/:code', lazy: async () => ({ Component: (await import('./participant/ParticipantPage')).ParticipantPage }) },
];
