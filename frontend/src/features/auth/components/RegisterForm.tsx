import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { useAuth } from '../context/AuthContext';
import { PASSWORD_MIN_LENGTH } from '../model/types';

type Fields = 'displayName' | 'email' | 'password';

export function RegisterForm() {
  const { t } = useI18n();
  const { register } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<Fields, string>>({ displayName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Fields) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Client checks mirror server rules for fast feedback; the server stays authoritative.
    const errors: Partial<Record<Fields, string>> = {};
    if (!values.displayName.trim()) errors.displayName = t('auth.register.nameRequired');
    if (!values.email.trim()) errors.email = t('auth.register.emailRequired');
    if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = t('auth.register.passwordTooShort', { min: PASSWORD_MIN_LENGTH });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      await register(values);
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
          <Alert tone="danger" title={t('auth.register.errorTitle')}>
            {formError}
          </Alert>
        </div>
      )}

      <TextField
        label={t('auth.fields.name')}
        name="displayName"
        autoComplete="name"
        isRequired
        maxLength={100}
        value={values.displayName}
        onChange={update('displayName')}
        error={fieldErrors.displayName}
      />

      <TextField
        label={t('auth.fields.email')}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        isRequired
        maxLength={254}
        value={values.email}
        onChange={update('email')}
        error={fieldErrors.email}
      />

      <PasswordField
        label={t('auth.fields.password')}
        name="password"
        autoComplete="new-password"
        isRequired
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={256}
        value={values.password}
        onChange={update('password')}
        error={fieldErrors.password}
        hint={t('auth.register.passwordHint', { min: PASSWORD_MIN_LENGTH })}
      />

      <Button type="submit" variant="contrast" size="lg" fullWidth isLoading={submitting}>
        {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button>
    </form>
  );
}
