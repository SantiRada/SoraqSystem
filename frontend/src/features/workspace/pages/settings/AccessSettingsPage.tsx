import { useRef, useState, type FormEvent } from 'react';
import { RefreshCw, UserMinus, UserPlus } from 'lucide-react';
import { Alert, Avatar, Badge, Button, Dialog, IconButton, LoadingState, PageHeader, SelectField, TextField } from '@/design-system';
import { useAuth } from '@/features/auth';
import { projectPermissions, projectsApi, type MemberRole, type ProjectMember, type ProjectRole } from '@/features/projects';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LeaveProjectPanel } from './LeaveProjectPanel';
import { SettingsNav } from './SettingsNav';
import { SettingsPanel } from './SettingsPanel';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Configuración → Acceso: who can see or edit the project. Only the owner manages access. */
export function AccessSettingsPage() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const { user } = useAuth();
  usePageMeta({ title: `${t('workspace.settings.access.title')} · ${project.name}`, noindex: true });

  const canManage = projectPermissions.canManageMembers(project.accessRole);
  const members = useApiQuery((signal) => projectsApi.members(project.id, signal), [project.id]);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ProjectMember | null>(null);
  const [busy, setBusy] = useState(false);

  const roleLabel = (role: ProjectRole) => t(`workspace.roles.${role}`);
  const memberRoleOptions = [
    { id: 'editor', label: t('workspace.roles.editor'), description: t('workspace.roles.editorDescription') },
    { id: 'viewer', label: t('workspace.roles.viewer'), description: t('workspace.roles.viewerDescription') },
  ];

  async function changeRole(member: ProjectMember, role: MemberRole) {
    if (role === member.role) return;
    setActionError(null);
    setNotice(null);
    try {
      const next = await projectsApi.updateMemberRole(project.id, member.id, role);
      members.setData(() => next);
      setNotice(t('workspace.settings.access.roleChanged'));
    } catch (error) {
      setActionError(toUserMessage(error, t));
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    setActionError(null);
    try {
      await projectsApi.removeMember(project.id, removing.id);
      members.setData((list) => list.filter((m) => m.id !== removing.id));
      setNotice(t('workspace.settings.access.removed'));
      setRemoving(null);
    } catch (error) {
      setActionError(toUserMessage(error, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow={t('workspace.settings.title')} title={t('workspace.settings.access.title')} description={t('workspace.settings.access.description')} />
      <SettingsNav />

      <div className="grid gap-6">
        {canManage && (
          <InvitePanel
            projectId={project.id}
            options={memberRoleOptions}
            onInvited={(list, name) => {
              members.setData(() => list);
              setActionError(null);
              setNotice(t('workspace.settings.access.invited', { name }));
            }}
          />
        )}

        <SettingsPanel
          headingId="members-title"
          title={t('workspace.settings.access.listTitle')}
          description={members.status === 'success' ? t('workspace.settings.access.count', { count: members.data.length }) : undefined}
        >
          {!canManage && (
            <Alert tone="info" title={t('workspace.roles.yourRole', { role: roleLabel(project.accessRole) })}>
              {t('workspace.settings.access.onlyOwnerManages')}
            </Alert>
          )}
          {notice && <Alert tone="success" title={notice} />}
          {actionError && (
            <Alert tone="danger" title={t('workspace.settings.access.actionErrorTitle')}>
              {actionError}
            </Alert>
          )}

          {members.status === 'loading' && <LoadingState label={t('workspace.settings.access.loading')} />}
          {members.status === 'error' && (
            <Alert
              tone="danger"
              title={t('workspace.settings.access.errorTitle')}
              action={
                <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={members.reload}>
                  {t('common.actions.tryAgain')}
                </Button>
              }
            >
              {toUserMessage(members.error, t)}
            </Alert>
          )}

          {members.status === 'success' && (
            <ul className="grid list-none divide-y divide-separator p-0">
              {members.data.map((member) => {
                const isSelf = member.id === user?.id;
                const editable = canManage && member.role !== 'owner';
                return (
                  <li key={member.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar size="sm">
                      <Avatar.Fallback>{initials(member.displayName)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.displayName} {isSelf && <span className="font-normal text-muted">{t('workspace.settings.access.you')}</span>}
                      </p>
                      <p className="truncate text-xs text-muted">{member.email}</p>
                    </div>
                    {editable ? (
                      <div className="flex items-center gap-1">
                        <SelectField
                          hideLabel
                          label={t('workspace.settings.access.changeRole', { name: member.displayName })}
                          value={member.role}
                          options={memberRoleOptions}
                          onChange={(role) => changeRole(member, role as MemberRole)}
                          className="w-36"
                        />
                        <IconButton
                          label={t('workspace.settings.access.remove', { name: member.displayName })}
                          icon={<UserMinus />}
                          onPress={() => setRemoving(member)}
                        />
                      </div>
                    ) : (
                      <Badge tone={member.role === 'owner' ? 'accent' : 'neutral'}>{roleLabel(member.role)}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SettingsPanel>

        {projectPermissions.canLeave(project.accessRole) && <LeaveProjectPanel project={project} />}
      </div>

      <Dialog
        isOpen={removing !== null}
        onClose={() => !busy && setRemoving(null)}
        title={t('workspace.settings.access.removeTitle')}
        description={removing ? t('workspace.settings.access.removeDescription', { name: removing.displayName }) : undefined}
        footer={
          <>
            <Button variant="ghost" onPress={() => setRemoving(null)} isDisabled={busy}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="danger" isLoading={busy} onPress={confirmRemove}>
              {t('workspace.settings.access.removeConfirm')}
            </Button>
          </>
        }
      />
    </>
  );
}

function InvitePanel({
  projectId,
  options,
  onInvited,
}: {
  projectId: string;
  options: { id: string; label: string; description: string }[];
  onInvited: (members: ProjectMember[], name: string) => void;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!email.trim()) {
      setFieldErrors({ email: t('workspace.settings.access.emailRequired') });
      focusFirstInvalid(formRef.current);
      return;
    }

    setSubmitting(true);
    try {
      const list = await projectsApi.addMember(projectId, email.trim(), role);
      const added = list.find((m) => m.email === email.trim().toLowerCase());
      setEmail('');
      setFieldErrors({});
      onInvited(list, added?.displayName ?? email.trim());
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'validation') setFieldErrors(error.fields);
      else setFormError(toUserMessage(error, t));
      focusFirstInvalid(formRef.current);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SettingsPanel headingId="invite-title" title={t('workspace.settings.access.inviteTitle')}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-4">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('workspace.settings.access.inviteErrorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-start">
          <TextField
            label={t('workspace.settings.access.inviteEmail')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            isRequired
            value={email}
            onChange={setEmail}
            error={fieldErrors.email ?? fieldErrors.role}
            hint={t('workspace.settings.access.inviteEmailHint')}
          />
          <SelectField label={t('workspace.settings.access.inviteRole')} value={role} options={options} onChange={(r) => setRole(r as MemberRole)} />
          <Button type="submit" leadingIcon={<UserPlus />} isLoading={submitting} className="md:mt-7">
            {submitting ? t('workspace.settings.access.inviting') : t('workspace.settings.access.inviteSubmit')}
          </Button>
        </div>
      </form>
    </SettingsPanel>
  );
}
