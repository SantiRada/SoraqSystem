import { Navigate, type RouteObject } from 'react-router';
import type { AccountTab } from '@/config/paths';

const TABS: AccountTab[] = ['profile', 'billing', 'session', 'preferences'];

/** Perfil pages, mounted under /app inside AppLayout (no sidebar): /app/account/{profile|billing|session|preferences}. */
export const accountRoutes: RouteObject[] = [
  {
    path: 'account',
    lazy: async () => ({ Component: (await import('./pages/AccountLayout')).AccountLayout }),
    children: [
      { index: true, element: <Navigate to="profile" replace /> },
      ...TABS.map((tab) => ({
        path: tab,
        lazy: async () => {
          const { AccountSectionPage } = await import('./pages/AccountSectionPage');
          return { Component: () => <AccountSectionPage tab={tab} /> };
        },
      })),
    ],
  },
];
