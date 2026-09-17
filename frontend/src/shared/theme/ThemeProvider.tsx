import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './ThemeContext';

const STORAGE_KEY = 'soraq-theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#070709', light: '#f9f9fb' };

function readInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/**
 * Dark by default; light on demand. Persisted per device (public/theme-init.js applies it pre-render).
 * HeroUI reads both `data-theme` and the `.dark`/`.light` class, so both are kept in sync.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', next);
    root.classList.remove('light', 'dark');
    root.classList.add(next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next]);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the theme still applies for this visit */
    }
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
