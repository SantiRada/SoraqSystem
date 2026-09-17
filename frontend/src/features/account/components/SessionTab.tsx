import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, Trash2 } from 'lucide-react';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth, useSignOutConfirmation } from '@/features/auth';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { accountApi } from '../api/accountApi';
import { DELETE_CONFIRMATION_WORD } from '../model/types';

/** Sesión y cuenta tab: sign out, and delete the account (password + typed confirmation). */
export function SessionTab() {
  const { t } = useI18n();
  const { endSession } = useAuth();
  const signOut = useSignOutConfirmation();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ currentPassword: '', confirmation: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};
    if (!values.currentPassword) errors.currentPassword = t('account.profile.currentPasswordRequired');
    if (values.confirmation !== DELETE_CONFIRMATION_WORD) errors.confirmation = t('account.session.confirmationMismatch');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setDeleting(true);
    try {
      await accountApi.deleteAccount(values);
      endSession();
      navigate(paths.home, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldErrors(error.fields);
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-8">
      <section aria-labelledby="session-signout-title" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-5">
        <div>
          <h3 id="session-signout-title" className="text-base font-semibold">
            {t('account.session.signOutTitle')}
          </h3>
          <p className="mt-1 text-sm text-muted">{t('account.session.signOutDescription')}</p>
        </div>
        <Button variant="secondary" leadingIcon={<LogOut />} isLoading={signOut.signingOut} onPress={signOut.requestSignOut}>
          {t('common.actions.signOut')}
        </Button>
        {signOut.dialog}
      </section>

      <section aria-labelledby="session-delete-title" className="rounded-2xl border border-danger/60 p-5">
        <h3 id="session-delete-title" className="text-base font-semibold text-danger">
          {t('account.session.deleteTitle')}
        </h3>
        <p className="mt-1 text-sm text-muted">{t('account.session.deleteDescription')}</p>

        <form ref={formRef} onSubmit={handleDelete} noValidate className="mt-4 grid gap-4">
          {formError && (
            <div tabIndex={-1} data-form-error>
              <Alert tone="danger" title={t('account.session.deleteErrorTitle')}>
                {formError}
              </Alert>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              label={t('account.session.deletePassword')}
              name="deleteCurrentPassword"
              autoComplete="current-password"
              isRequired
              value={values.currentPassword}
              onChange={(currentPassword) => setValues((v) => ({ ...v, currentPassword }))}
              error={fieldErrors.currentPassword}
            />
            <TextField
              label={t('account.session.deleteConfirmation')}
              name="confirmation"
              autoComplete="off"
              isRequired
              value={values.confirmation}
              onChange={(confirmation) => setValues((v) => ({ ...v, confirmation }))}
              error={fieldErrors.confirmation}
            />
          </div>
          <div>
            <Button
              type="submit"
              variant="danger"
              leadingIcon={<Trash2 />}
              isLoading={deleting}
              isDisabled={values.confirmation !== DELETE_CONFIRMATION_WORD || !values.currentPassword}
            >
              {deleting ? t('account.session.deleting') : t('account.session.deleteSubmit')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
