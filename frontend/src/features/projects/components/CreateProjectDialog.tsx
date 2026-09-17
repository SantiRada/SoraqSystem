import { useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Dialog, TextAreaField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { projectsApi } from '../api/projectsApi';
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX, type Project } from '../model/types';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const EMPTY = { name: '', description: '' };

export function CreateProjectDialog({ isOpen, onClose, onCreated }: CreateProjectDialogProps) {
  const { t } = useI18n();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    if (submitting) return;
    setValues(EMPTY);
    setFieldErrors({});
    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!values.name.trim()) {
      setFieldErrors({ name: t('projects.create.nameRequired') });
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      const project = await projectsApi.create({ name: values.name, description: values.description.trim() || null });
      setValues(EMPTY);
      setFieldErrors({});
      onCreated(project);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') {
        setFieldErrors(error.fields);
      } else {
        setFormError(toUserMessage(error, t));
      }
      focusFirstInvalid(formRef.current);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={close}
      isDismissable={!submitting}
      hasUnsavedChanges={values.name !== EMPTY.name || values.description !== EMPTY.description}
      title={t('projects.create.title')}
      description={t('projects.create.description')}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onPress={requestClose} isDisabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form={formId} isLoading={submitting}>
            {submitting ? t('projects.create.submitting') : t('projects.create.submit')}
          </Button>
        </>
      )}
    >
      <form id={formId} ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('projects.create.errorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        <TextField
          label={t('projects.create.name')}
          name="name"
          isRequired
          autoFocus
          maxLength={PROJECT_NAME_MAX}
          autoComplete="off"
          placeholder={t('projects.create.namePlaceholder')}
          value={values.name}
          onChange={(name) => setValues((v) => ({ ...v, name }))}
          error={fieldErrors.name}
        />
        <TextAreaField
          label={t('projects.create.descriptionLabel')}
          name="description"
          maxLength={PROJECT_DESCRIPTION_MAX}
          value={values.description}
          onChange={(description) => setValues((v) => ({ ...v, description }))}
          error={fieldErrors.description}
          hint={t('projects.create.descriptionHint')}
        />
      </form>
    </Dialog>
  );
}
