import { RouterProvider } from 'react-router';
import { AuthProvider } from '@/features/auth';
import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { router } from './router';

/** Global providers. Add a provider here only if it is truly app-wide. */
export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
