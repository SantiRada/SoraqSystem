import { LogOut } from 'lucide-react';
import { Button } from '@/design-system';
import { useI18n } from '@/i18n';
import { useSignOutConfirmation } from './useSignOutConfirmation';

/** Visible sign out (floating corner controls outside projects). Asks for confirmation. */
export function SignOutButton() {
  const { t } = useI18n();
  const { requestSignOut, signingOut, dialog } = useSignOutConfirmation();

  return (
    <>
      <Button variant="ghost" size="sm" leadingIcon={<LogOut />} isLoading={signingOut} onPress={requestSignOut}>
        {signingOut ? t('common.actions.signingOut') : t('common.actions.signOut')}
      </Button>
      {dialog}
    </>
  );
}
