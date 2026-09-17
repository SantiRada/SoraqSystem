import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Button as HeroButton,
  Description,
  FieldError,
  Input,
  InputGroup,
  Label,
  TextArea,
  TextField as HeroTextField,
} from '@heroui/react';
import { useI18n } from '@/i18n';

/**
 * Accessible form fields on top of HeroUI (React Aria):
 * label ↔ input association, description and error wiring, aria-invalid.
 *
 * Validation is owned by the feature (client + server) and passed as `error`;
 * `validationBehavior="aria"` prevents native browser bubbles.
 */
interface FieldBaseProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Persistent help text (preferred over placeholders). */
  hint?: ReactNode;
  /** User-facing error: what happened + how to fix it. */
  error?: string | null;
  isRequired?: boolean;
  isDisabled?: boolean;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
  /** Hide the visible label (a shared heading describes the group); it stays the accessible name. */
  hideLabel?: boolean;
}

function FieldShell({
  label,
  name,
  value,
  onChange,
  hint,
  error,
  isRequired,
  isDisabled,
  type,
  hideLabel,
  children,
}: Omit<FieldBaseProps, 'maxLength' | 'minLength' | 'placeholder' | 'autoFocus'> & { type?: string; children: ReactNode }) {
  const { t } = useI18n();

  return (
    <HeroTextField
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      fullWidth
      className="gap-2"
    >
      <Label className={hideLabel ? 'sr-only' : 'text-sm font-medium text-foreground'}>
        {label}
        {!isRequired && <span className="font-normal text-muted"> {t('common.form.optional')}</span>}
      </Label>
      {children}
      {hint && <Description className="text-sm text-muted">{hint}</Description>}
      <FieldError className="text-sm">{error}</FieldError>
    </HeroTextField>
  );
}

export interface TextFieldProps extends FieldBaseProps {
  type?: 'text' | 'email' | 'url' | 'search' | 'tel';
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'url' | 'search' | 'tel' | 'numeric';
}

export function TextField({ maxLength, minLength, placeholder, autoFocus, autoComplete, inputMode, ...shell }: TextFieldProps) {
  return (
    <FieldShell {...shell}>
      <Input
        maxLength={maxLength}
        minLength={minLength}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="text-base"
      />
    </FieldShell>
  );
}

export function TextAreaField({ maxLength, placeholder, autoFocus, rows = 4, ...shell }: FieldBaseProps & { rows?: number }) {
  return (
    <FieldShell {...shell}>
      <TextArea maxLength={maxLength} placeholder={placeholder} autoFocus={autoFocus} rows={rows} className="text-base" />
    </FieldShell>
  );
}

/** Password with show/hide toggle (reduces typos; paste stays allowed). */
export function PasswordField({ maxLength, minLength, autoFocus, autoComplete, ...shell }: FieldBaseProps & { autoComplete: string }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell {...shell} type={visible ? 'text' : 'password'}>
      <InputGroup fullWidth>
        <InputGroup.Input maxLength={maxLength} minLength={minLength} autoFocus={autoFocus} autoComplete={autoComplete} className="text-base" />
        <InputGroup.Suffix className="pe-1">
          <HeroButton
            isIconOnly
            size="sm"
            variant="ghost"
            className="rounded-full"
            aria-label={t('common.actions.showPassword')}
            aria-pressed={visible}
            onPress={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </HeroButton>
        </InputGroup.Suffix>
      </InputGroup>
    </FieldShell>
  );
}
