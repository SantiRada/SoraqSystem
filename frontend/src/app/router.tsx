import { createBrowserRouter, Navigate } from 'react-router';
import { LoadingState } from '@/design-system';
import { useI18n } from '@/i18n';
import { accountRoutes } from '@/features/account';
import { authRoutes, RedirectIfAuthenticated, RequireAuth } from '@/features/auth';
import { cardSortingRoutes, participantRoutes } from '@/features/card-sorting';
import { marketingRoutes } from '@/features/marketing';
import { projectRoutes } from '@/features/projects';
import { NotFoundPage, RouteErrorPage } from '@/features/system';
import { workspaceRoutes } from '@/features/workspace';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { RootLayout } from './layouts/RootLayout';

/**
 * ROUTE MAP — composition only. Each feature owns its routes (features/<name>/routes.tsx);
 * this file decides WHERE they mount and WHICH guard/layout wraps them.
 *
 *   /                 PublicLayout   marketing (indexable)
 *   /login /register  AuthLayout     guest-only
 *   /app/projects     AppLayout      RequireAuth; no sidebar, floating corner controls
 *   /app/account/*    AppLayout      Perfil pages (features/account)
 *   /app/shared/card-sorting/:id   AppLayout  study shared read-only
 *   /cardsorting/:slug/:code       participant flow (public, noindex)
 *   /app/projects/:id ProjectWorkspaceLayout (features/workspace): collapsible sidebar
 *   *                 404
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    HydrateFallback: AppLoading,
    children: [
      // Participant links: no app chrome, no auth.
      ...participantRoutes,
      {
        element: <PublicLayout />,
        children: [...marketingRoutes, { path: '*', Component: NotFoundPage }],
      },
      {
        element: <RedirectIfAuthenticated />,
        children: [{ element: <AuthLayout />, children: authRoutes }],
      },
      {
        path: 'app',
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="projects" replace /> },
              ...projectRoutes,
              ...accountRoutes,
              ...cardSortingRoutes,
              { path: '*', Component: NotFoundPage },
            ],
          },
          ...workspaceRoutes,
        ],
      },
    ],
  },
]);

function AppLoading() {
  const { t } = useI18n();
  return <LoadingState label={t('common.loading.app')} fill />;
}
