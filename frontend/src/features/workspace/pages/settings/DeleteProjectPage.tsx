import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { Alert, Button, PageHeader, TextField } from '@/design-system';
import { paths } from '@/config/paths';
import { projectPermissions, projectsApi } from '@/features/projects';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LeaveProjectPanel } from './LeaveProjectPanel';
import { SettingsNav } from './SettingsNav';
import { SettingsPanel } from './SettingsPanel';

/**
 * Configuración → Eliminar proyecto. Owner only; requires typing the exact project name
 * (checked again by the server). Non-owners can leave the project instead.
 */
export function DeleteProjectPage() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const navigate = useNavigate();
  usePageMeta({ title: `${t('workspace.settings.delete.title')} · ${project.name}`, noindex: true });

  const formRef = useRef<HTMLFormElement>(null);
  const [confirmName, setConfirmName] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = projectPermissions.canDelete(project.accessRole);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (confirmName !== project.name) {
      setFieldError(t('workspace.settings.delete.mismatch'));
      focusFirstInvalid(formRef.current);
      return;
    }

    setDeleting(true);
    try {
      await projectsApi.remove(project.id, confirmName);
      navigate(paths.projects, { replace: true, state: { deletedProject: project.name } });
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldError(error.fields.confirmName ?? t('workspace.settings.delete.mismatch'));
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow={t('workspace.settings.title')} title={t('workspace.settings.delete.title')} />
      <SettingsNav />

      <div className="grid gap-6">
        <SettingsPanel headingId="delete-project-title" tone="danger" title={t('workspace.settings.delete.title')} description={t('workspace.settings.delete.description')}>
          {canDelete ? (
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid max-w-xl gap-5">
              {formError && (
                <div tabIndex={-1} data-form-error>
                  <Alert tone="danger" title={t('workspace.settings.delete.errorTitle')}>
                    {formError}
                  </Alert>
                </div>
              )}
              <TextField
                label={t('workspace.settings.delete.confirmLabel', { name: project.name })}
                name="confirmName"
                isRequired
                autoComplete="off"
                value={confirmName}
                onChange={(value) => {
                  setFieldError(null);
                  setConfirmName(value);
                }}
                error={fieldError}
              />
              <div>
                <Button type="submit" variant="danger" leadingIcon={<Trash2 />} isLoading={deleting} isDisabled={confirmName !== project.name}>
                  {deleting ? t('workspace.settings.delete.deleting') : t('workspace.settings.delete.submit')}
                </Button>
              </div>
            </form>
          ) : (
            <Alert tone="info" title={t('workspace.roles.yourRole', { role: t(`workspace.roles.${project.accessRole}`) })}>
              {t('workspace.settings.delete.onlyOwner')}
            </Alert>
          )}
        </SettingsPanel>

        {projectPermissions.canLeave(project.accessRole) && <LeaveProjectPanel project={project} />}
      </div>
    </>
  );
}
