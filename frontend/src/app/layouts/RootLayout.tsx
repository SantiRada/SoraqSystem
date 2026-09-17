import { Outlet, ScrollRestoration, useHref, useNavigate, useNavigation } from 'react-router';
import { RouterProvider as AriaRouterProvider } from 'react-aria-components';
import { useRouteFocus } from '@/shared/a11y/useRouteFocus';

/**
 * Wraps every route:
 *  - React Aria router bridge: HeroUI links/menu items with `href` navigate client-side.
 *  - Focus management, scroll restoration and a navigation progress bar.
 */
export function RootLayout() {
  useRouteFocus();
  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <AriaRouterProvider navigate={(to) => void navigate(to)} useHref={useHref}>
      {/* Visual-only progress for lazy route loads; screen readers get the focus move on arrival. */}
      {navigation.state === 'loading' && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[100002] h-0.5 origin-left animate-pulse bg-accent" />
      )}
      <Outlet />
      <ScrollRestoration />
    </AriaRouterProvider>
  );
}
