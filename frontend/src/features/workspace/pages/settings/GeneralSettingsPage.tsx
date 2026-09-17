import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, PageHeader, TextAreaField, TextField } from '@/design-system';
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX, projectPermissions, projectsApi } from '@/features/projects';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SettingsNav } from './SettingsNav';
import { SettingsPanel } from './SettingsPanel';

/** Configuración → General: project name and description (owner/editor). */
export function GeneralSettingsPage() {
  const { t } = useI18n();
  const { project, setProject } = useWorkspace();
  usePageMeta({ title: `${t('workspace.settings.general.title')} · ${project.name}`, noindex: true });

  const canEdit = projectPermissions.canUpdate(project.accessRole);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ name: project.name, description: project.description ?? '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = values.name !== project.name || values.description !== (project.description ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    if (!values.name.trim()) {
      setFieldErrors({ name: t('workspace.settings.general.nameRequired') });
      focusFirstInvalid(formRef.current);
      return;
    }

    setSaving(true);
    try {
      const updated = await projectsApi.update(project.id, { name: values.name, description: values.description.trim() || null });
      setProject(updated);
      setValues({ name: updated.name, description: updated.description ?? '' });
      setFieldErrors({});
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
    <>
      <PageHeader eyebrow={t('workspace.settings.title')} title={t('workspace.settings.general.title')} />
      <SettingsNav />

      <SettingsPanel headingId="general-settings-title" title={t('workspace.settings.general.title')} description={t('workspace.settings.general.description')}>
        {!canEdit && (
          <Alert tone="info" title={t('workspace.settings.general.readOnlyTitle')}>
            {t('workspace.settings.general.readOnly')}
          </Alert>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid max-w-2xl gap-5">
          {formError && (
            <div tabIndex={-1} data-form-error>
              <Alert tone="danger" title={t('workspace.settings.general.errorTitle')}>
                {formError}
              </Alert>
            </div>
          )}
          {saved && <Alert tone="success" title={t('workspace.settings.general.saved')} />}

          <TextField
            label={t('workspace.settings.general.name')}
            name="name"
            isRequired
            isDisabled={!canEdit}
            maxLength={PROJECT_NAME_MAX}
            autoComplete="off"
            value={values.name}
            onChange={(name) => {
              setSaved(false);
              setValues((v) => ({ ...v, name }));
            }}
            error={fieldErrors.name}
          />
          <TextAreaField
            label={t('workspace.settings.general.descriptionLabel')}
            name="description"
            isDisabled={!canEdit}
            maxLength={PROJECT_DESCRIPTION_MAX}
            value={values.description}
            onChange={(description) => {
              setSaved(false);
              setValues((v) => ({ ...v, description }));
            }}
            error={fieldErrors.description}
            hint={t('workspace.settings.general.descriptionHint')}
          />

          {canEdit && (
            <div>
              <Button type="submit" isLoading={saving} isDisabled={!isDirty}>
                {saving ? t('workspace.settings.general.saving') : t('workspace.settings.general.save')}
              </Button>
            </div>
          )}
        </form>
      </SettingsPanel>
    </>
  );
}
