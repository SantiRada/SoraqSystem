import { Navigate, type RouteObject } from 'react-router';

/**
 * Project workspace routes, mounted under /app (inside RequireAuth, OUTSIDE AppLayout).
 *
 *   /app/projects/:projectId                      overview   (primary sidebar expanded)
 *   /app/projects/:projectId/:sectionId           section    (rail + secondary sidebar)
 *   /app/projects/:projectId/:sectionId/:itemId   item space (future modules mount here)
 *   /app/projects/:projectId/settings/{general|access|delete}   project settings, opened from the account menu
 *   /app/projects/:projectId/research/product                     product notes (module: features/product-context)
 *   /app/projects/:projectId/documentation/context-prompt         context prompt (module: features/product-context)
 *   /app/projects/:projectId/navigation/card-sorting[/:studyId]    card sorting (module: features/card-sorting)
 * Static routes win over params.
 */
export const workspaceRoutes: RouteObject[] = [
  {
    path: 'projects/:projectId',
    lazy: async () => ({ Component: (await import('./layout/ProjectWorkspaceLayout')).ProjectWorkspaceLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/ProjectOverviewPage')).ProjectOverviewPage }) },
      { path: 'settings', element: <Navigate to="general" replace /> },
      { path: 'settings/general', lazy: async () => ({ Component: (await import('./pages/settings/GeneralSettingsPage')).GeneralSettingsPage }) },
      { path: 'settings/access', lazy: async () => ({ Component: (await import('./pages/settings/AccessSettingsPage')).AccessSettingsPage }) },
      { path: 'settings/delete', lazy: async () => ({ Component: (await import('./pages/settings/DeleteProjectPage')).DeleteProjectPage }) },
      { path: 'research/product', lazy: async () => ({ Component: (await import('./pages/modules/ProductNotesRoute')).ProductNotesRoute }) },
      { path: 'documentation/context-prompt', lazy: async () => ({ Component: (await import('./pages/modules/ContextPromptRoute')).ContextPromptRoute }) },
      { path: 'navigation/card-sorting', lazy: async () => ({ Component: (await import('./pages/modules/CardSortingRoutes')).CardSortListRoute }) },
      { path: 'navigation/card-sorting/:studyId', lazy: async () => ({ Component: (await import('./pages/modules/CardSortingRoutes')).CardSortStudyRoute }) },
      { path: ':sectionId', lazy: async () => ({ Component: (await import('./pages/SectionPage')).SectionPage }) },
      { path: ':sectionId/:itemId', lazy: async () => ({ Component: (await import('./pages/ItemPage')).ItemPage }) },
    ],
  },
];
