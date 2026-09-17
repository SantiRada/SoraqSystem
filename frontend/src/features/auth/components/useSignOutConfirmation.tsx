import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button, Dialog } from '@/design-system';
import { useI18n } from '@/i18n';
import { useAuth } from '../context/AuthContext';

/**
 * Sign out always asks first (prevents accidental loss of the session from a misclick).
 * Returns `requestSignOut` for any trigger and the `dialog` element to render next to it.
 */
export function useSignOutConfirmation() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const dialog = (
    <Dialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      isDismissable={!signingOut}
      title={t('common.signOutConfirm.title')}
      description={t('common.signOutConfirm.description')}
      footer={
        <>
          <Button variant="ghost" onPress={() => setIsOpen(false)} isDisabled={signingOut}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            variant="contrast"
            autoFocus
            leadingIcon={<LogOut />}
            isLoading={signingOut}
            onPress={async () => {
              setSigningOut(true);
              await logout().catch(() => undefined);
            }}
          >
            {signingOut ? t('common.actions.signingOut') : t('common.actions.signOut')}
          </Button>
        </>
      }
    />
  );

  return { requestSignOut: () => setIsOpen(true), signingOut, dialog };
}
