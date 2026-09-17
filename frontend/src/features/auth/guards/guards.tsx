import { Navigate, Outlet, useLocation } from 'react-router';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { Button, EmptyState, LoadingState } from '@/design-system';
import { isSafeRedirect, paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { useAuth } from '../context/AuthContext';

/** Shown while the session is checked, or when the API cannot be reached. */
function SessionGate({ onRetry, unavailable }: { onRetry: () => void; unavailable: boolean }) {
  const { t } = useI18n();

  if (!unavailable) return <LoadingState label={t('auth.session.checking')} fill />;

  return (
    <main id="main-content" className="grid min-h-dvh place-items-center p-4">
      <EmptyState
        icon={<ServerCrash />}
        headingLevel="h1"
        title={t('auth.session.unavailableTitle')}
        description={t('auth.session.unavailableDescription')}
        action={
          <Button variant="secondary" leadingIcon={<RefreshCw />} onPress={onRetry}>
            {t('common.actions.tryAgain')}
          </Button>
        }
      />
    </main>
  );
}

/**
 * Guard for private areas. UX only — the API still rejects unauthenticated requests.
 * Preserves the requested location to return after signing in.
 */
export function RequireAuth() {
  const { status, refresh } = useAuth();
  const location = useLocation();

  if (status === 'checking' || status === 'unavailable') {
    return <SessionGate unavailable={status === 'unavailable'} onRetry={refresh} />;
  }

  if (status === 'anonymous') {
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}

/** Sign-in / sign-up: authenticated users go straight to the app. */
export function RedirectIfAuthenticated() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={isSafeRedirect(from) ? from : paths.projects} replace />;
  }

  return <Outlet />;
}
