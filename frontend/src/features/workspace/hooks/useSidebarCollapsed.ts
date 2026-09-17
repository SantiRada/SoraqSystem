import { useCallback, useState } from 'react';

/** Per-device UI preference (not sensitive, not synced): whether the project sidebar is an icon rail. */
const STORAGE_KEY = 'soraq-sidebar-collapsed';

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false; // storage blocked (private mode, disabled site data): default expanded
  }
}

export function useSidebarCollapsed(): readonly [collapsed: boolean, toggle: () => void] {
  const [collapsed, setCollapsed] = useState(readPreference);

  const toggle = useCallback(() => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Preference simply won't persist.
    }
  }, [collapsed]);

  return [collapsed, toggle] as const;
}
