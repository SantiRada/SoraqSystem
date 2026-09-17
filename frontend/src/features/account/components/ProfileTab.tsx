import { useRef, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, PasswordField, TextField } from '@/design-system';
import { PASSWORD_MIN_LENGTH, useAuth, UserAvatar, type User } from '@/features/auth';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { accountApi } from '../api/accountApi';

/** Perfil tab: current data, change name/email, change password. */
export function ProfileTabPanel() {
  const { t } = useI18n();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="grid gap-8">
      <section aria-labelledby="profile-summary-title" className="rounded-2xl border border-border p-5">
        <h3 id="profile-summary-title" className="sr-only">
          {t('account.profile.summaryTitle')}
        </h3>
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <dl className="grid min-w-0 flex-1 gap-2 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-muted">{t('account.profile.name')}</dt>
              <dd className="flex items-center gap-2 truncate font-medium">
                {user.displayName}
                {user.role === 'admin' && <Badge tone="accent">{t('common.roles.admin')}</Badge>}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted">{t('account.profile.email')}</dt>
              <dd className="truncate">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('account.profile.password')}</dt>
              <dd>
                <span aria-hidden="true">••••••••••••</span>
                <span className="sr-only">{t('account.profile.passwordMasked')}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <DetailsForm user={user} />
      <PasswordForm />
    </div>
  );
}

function DetailsForm({ user }: { user: User }) {
  const { t } = useI18n();
  const { updateUser } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ displayName: user.displayName, email: user.email, currentPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const emailChanged = values.email.trim().toLowerCase() !== user.email;
  const isDirty = values.displayName !== user.displayName || emailChanged;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const errors: Record<string, string> = {};
    if (!values.displayName.trim()) errors.displayName = t('account.profile.nameRequired');
    if (!values.email.trim()) errors.email = t('account.profile.emailRequired');
    if (emailChanged && !values.currentPassword) errors.currentPassword = t('account.profile.currentPasswordRequired');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    try {
      const { user: updated } = await accountApi.updateProfile({
        displayName: values.displayName,
        email: values.email,
        currentPassword: emailChanged ? values.currentPassword : undefined,
      });
      updateUser(updated);
      setValues({ displayName: updated.displayName, email: updated.email, currentPassword: '' });
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldErrors(error.fields);
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="profile-details-title">
      <h3 id="profile-details-title" className="text-base font-semibold">
        {t('account.profile.detailsTitle')}
      </h3>
      <p className="mt-1 text-sm text-muted">{t('account.profile.detailsDescription')}</p>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('account.profile.errorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        {saved && <Alert tone="success" title={t('account.profile.saved')} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('account.profile.name')}
            name="displayName"
            autoComplete="name"
            isRequired
            maxLength={100}
            value={values.displayName}
            onChange={(displayName) => setValues((v) => ({ ...v, displayName }))}
            error={fieldErrors.displayName}
          />
          <TextField
            label={t('account.profile.email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            isRequired
            maxLength={254}
            value={values.email}
            onChange={(email) => setValues((v) => ({ ...v, email }))}
            error={fieldErrors.email}
          />
        </div>

        {/* Re-authentication appears only when it is needed (progressive disclosure). */}
        {emailChanged && (
          <PasswordField
            label={t('account.profile.currentPassword')}
            name="currentPasswordForEmail"
            autoComplete="current-password"
            isRequired
            value={values.currentPassword}
            onChange={(currentPassword) => setValues((v) => ({ ...v, currentPassword }))}
            error={fieldErrors.currentPassword}
            hint={t('account.profile.currentPasswordForEmail')}
          />
        )}

        <div>
          <Button type="submit" isLoading={saving} isDisabled={!isDirty}>
            {saving ? t('account.profile.saving') : t('account.profile.save')}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { t } = useI18n();
  const { updateUser } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [values, setValues] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setChanged(false);

    const errors: Record<string, string> = {};
    if (!values.currentPassword) errors.currentPassword = t('account.profile.currentPasswordRequired');
    if (values.newPassword.length < PASSWORD_MIN_LENGTH) errors.newPassword = t('auth.register.passwordTooShort', { min: PASSWORD_MIN_LENGTH });
    else if (values.newPassword !== values.confirmPassword) errors.confirmPassword = t('account.password.mismatch');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    try {
      const { user } = await accountApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      updateUser(user);
      setValues(empty);
      setFieldErrors({});
      setChanged(true);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldErrors(error.fields);
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="profile-password-title" className="border-t border-separator pt-8">
      <h3 id="profile-password-title" className="text-base font-semibold">
        {t('account.password.title')}
      </h3>
      <p className="mt-1 text-sm text-muted">{t('account.password.description')}</p>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('account.password.errorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        {changed && <Alert tone="success" title={t('account.password.changed')} />}

        <PasswordField
          label={t('account.password.current')}
          name="currentPassword"
          autoComplete="current-password"
          isRequired
          value={values.currentPassword}
          onChange={(currentPassword) => setValues((v) => ({ ...v, currentPassword }))}
          error={fieldErrors.currentPassword}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label={t('account.password.new')}
            name="newPassword"
            autoComplete="new-password"
            isRequired
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={256}
            value={values.newPassword}
            onChange={(newPassword) => setValues((v) => ({ ...v, newPassword }))}
            error={fieldErrors.newPassword}
            hint={t('account.password.newHint', { min: PASSWORD_MIN_LENGTH })}
          />
          <PasswordField
            label={t('account.password.confirm')}
            name="confirmPassword"
            autoComplete="new-password"
            isRequired
            maxLength={256}
            value={values.confirmPassword}
            onChange={(confirmPassword) => setValues((v) => ({ ...v, confirmPassword }))}
            error={fieldErrors.confirmPassword}
          />
        </div>
        <div>
          <Button type="submit" variant="secondary" isLoading={saving}>
            {saving ? t('account.password.submitting') : t('account.password.submit')}
          </Button>
        </div>
      </form>
    </section>
  );
}
