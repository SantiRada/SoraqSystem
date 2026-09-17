import { useLocation } from 'react-router';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { AuthPanel } from '../components/AuthPanel';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const { t } = useI18n();
  const location = useLocation();
  usePageMeta({ title: t('auth.login.metaTitle'), description: t('auth.login.metaDescription'), noindex: true });

  return (
    <AuthPanel
      title={t('auth.login.title')}
      description={t('auth.login.description')}
      switchPrompt={t('auth.login.noAccount')}
      switchLabel={t('auth.login.createAccount')}
      switchTo={paths.register}
      switchState={location.state}
    >
      <LoginForm />
    </AuthPanel>
  );
}
