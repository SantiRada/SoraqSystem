import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Dialog, TextAreaField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { NOTE_BODY_MAX, NOTE_TITLE_MAX, type ProductNoteInput } from '../model/types';

interface NoteFormDialogProps {
  mode: 'create' | 'edit';
  initial: ProductNoteInput;
  onSubmit: (input: ProductNoteInput) => Promise<void>;
  onClose: () => void;
}

/** Create / edit a product note. Mounted only while open, so every opening starts from `initial`. */
export function NoteFormDialog({ mode, initial, onSubmit, onClose }: NoteFormDialogProps) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};
    if (!values.title.trim()) errors.title = t('productContext.notes.form.titleRequired');
    if (!values.body.trim()) errors.body = t('productContext.notes.form.bodyRequired');
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ title: values.title.trim(), body: values.body.trim() });
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldErrors(error.fields);
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
      setSaving(false);
    }
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      isDismissable={!saving}
      hasUnsavedChanges={values.title !== initial.title || values.body !== initial.body}
      size="lg"
      title={mode === 'create' ? t('productContext.notes.form.createTitle') : t('productContext.notes.form.editTitle')}
      description={t('productContext.notes.form.description')}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onPress={requestClose} isDisabled={saving}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="product-note-form" isLoading={saving}>
            {saving ? t('productContext.notes.form.saving') : t('productContext.notes.form.save')}
          </Button>
        </>
      )}
    >
      <form id="product-note-form" ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('productContext.notes.form.errorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        <TextField
          label={t('productContext.notes.form.titleLabel')}
          name="title"
          isRequired
          autoFocus={mode === 'create' && !initial.title}
          maxLength={NOTE_TITLE_MAX}
          hint={t('productContext.notes.form.titleHint')}
          value={values.title}
          onChange={(title) => setValues((v) => ({ ...v, title }))}
          error={fieldErrors.title}
        />
        <TextAreaField
          label={t('productContext.notes.form.bodyLabel')}
          name="body"
          isRequired
          autoFocus={mode === 'edit' || Boolean(initial.title)}
          rows={10}
          maxLength={NOTE_BODY_MAX}
          hint={t('productContext.notes.form.bodyHint', { max: NOTE_BODY_MAX })}
          value={values.body}
          onChange={(body) => setValues((v) => ({ ...v, body }))}
          error={fieldErrors.body}
        />
      </form>
    </Dialog>
  );
}
