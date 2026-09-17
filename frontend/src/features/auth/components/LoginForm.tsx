import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { useAuth } from '../context/AuthContext';

type Fields = 'email' | 'password';

export function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<Fields, string>>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Fields) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: Partial<Record<Fields, string>> = {};
    if (!values.email.trim()) errors.email = t('auth.login.emailRequired');
    if (!values.password) errors.password = t('auth.login.passwordRequired');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      // On success, RedirectIfAuthenticated navigates away.
      await login(values);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') {
        setFieldErrors(error.fields);
      } else {
        setFormError(toUserMessage(error, t));
      }
      focusFirstInvalid(formRef.current);
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <div tabIndex={-1} data-form-error className="rounded-2xl focus-visible:outline-2 focus-visible:outline-focus">
          <Alert tone="danger" title={t('auth.login.errorTitle')}>
            {formError}
          </Alert>
        </div>
      )}

      <TextField
        label={t('auth.fields.email')}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        isRequired
        value={values.email}
        onChange={update('email')}
        error={fieldErrors.email}
      />

      <PasswordField
        label={t('auth.fields.password')}
        name="password"
        autoComplete="current-password"
        isRequired
        value={values.password}
        onChange={update('password')}
        error={fieldErrors.password}
      />

      <Button type="submit" variant="contrast" size="lg" fullWidth isLoading={submitting}>
        {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
    </form>
  );
}
