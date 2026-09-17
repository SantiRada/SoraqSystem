import { useLocation } from 'react-router';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { AuthPanel } from '../components/AuthPanel';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  const { t } = useI18n();
  const location = useLocation();
  usePageMeta({ title: t('auth.register.metaTitle'), description: t('auth.register.metaDescription'), path: paths.register });

  return (
    <AuthPanel
      title={t('auth.register.title')}
      description={t('auth.register.description')}
      switchPrompt={t('auth.register.haveAccount')}
      switchLabel={t('auth.register.signIn')}
      switchTo={paths.login}
      switchState={location.state}
    >
      <RegisterForm />
    </AuthPanel>
  );
}
