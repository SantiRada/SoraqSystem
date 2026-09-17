import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { LayoutGrid, Plus, RefreshCw } from 'lucide-react';
import { Alert, Button, Dialog, EmptyState, LoadingState, PageHeader, TextField } from '@/design-system';
import { projectPermissions, type Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { cardSortingApi } from '../api/cardSortingApi';
import { StudyGrid } from '../components/StudyGrid';
import { LIMITS } from '../model/types';

interface CardSortListPageProps {
  project: Project;
  eyebrow?: ReactNode;
  studyHref: (studyId: string) => string;
}

/** Navegación → Arquitectura → Card Sorting: the project's studies. */
export function CardSortListPage({ project, eyebrow, studyHref }: CardSortListPageProps) {
  const { t } = useI18n();
  usePageMeta({ title: `${t('cardSorting.list.title')} · ${project.name}`, noindex: true });
  const navigate = useNavigate();
  const canEdit = projectPermissions.canUpdate(project.accessRole);
  const studies = useApiQuery((signal) => cardSortingApi.list(project.id, signal), [project.id]);
  const [creating, setCreating] = useState(false);

  const count = studies.status === 'success' ? studies.data.length : 0;

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={t('cardSorting.list.title')}
        description={t('cardSorting.list.description')}
        actions={
          canEdit && count > 0 ? (
            <Button variant="contrast" leadingIcon={<Plus />} onPress={() => setCreating(true)}>
              {t('cardSorting.list.newStudy')}
            </Button>
          ) : undefined
        }
      />

      {studies.status === 'loading' && <LoadingState label={t('cardSorting.list.loading')} />}
      {studies.status === 'error' && (
        <Alert
          tone="danger"
          title={t('cardSorting.list.loadErrorTitle')}
          action={
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={studies.reload}>
              {t('common.actions.tryAgain')}
            </Button>
          }
        >
          {toUserMessage(studies.error, t)}
        </Alert>
      )}

      {studies.status === 'success' && count === 0 && (
        <EmptyState
          className="min-h-[50dvh] justify-center"
          icon={<LayoutGrid />}
          title={t('cardSorting.list.emptyTitle')}
          description={canEdit ? t('cardSorting.list.emptyDescription') : t('cardSorting.list.emptyReadOnly')}
          action={
            canEdit ? (
              <Button variant="contrast" leadingIcon={<Plus />} onPress={() => setCreating(true)}>
                {t('cardSorting.list.newStudy')}
              </Button>
            ) : undefined
          }
        />
      )}

      {studies.status === 'success' && count > 0 && (
        <section aria-labelledby="card-sorts-heading">
          <h2 id="card-sorts-heading" className="mb-4 text-sm text-muted">
            {t('cardSorting.list.count', { count })}
          </h2>
          <StudyGrid studies={studies.data} studyHref={studyHref} />
        </section>
      )}

      {creating && (
        <CreateStudyDialog
          onClose={() => setCreating(false)}
          onCreate={async (name) => {
            const study = await cardSortingApi.create(project.id, name);
            navigate(studyHref(study.id));
          }}
        />
      )}
    </>
  );
}

function CreateStudyDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => Promise<void> }) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setError(t('cardSorting.list.nameRequired'));
      focusFirstInvalid(formRef.current);
      return;
    }
    setSaving(true);
    try {
      await onCreate(name.trim());
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'validation') setError(err.fields.name ?? toUserMessage(err, t));
      else setFormError(toUserMessage(err, t));
      focusFirstInvalid(formRef.current);
      setSaving(false);
    }
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      isDismissable={!saving}
      hasUnsavedChanges={name.trim() !== ''}
      title={t('cardSorting.list.createTitle')}
      description={t('cardSorting.list.createDescription')}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onPress={requestClose} isDisabled={saving}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="create-card-sort-form" isLoading={saving}>
            {saving ? t('cardSorting.list.creating') : t('cardSorting.list.create')}
          </Button>
        </>
      )}
    >
      <form id="create-card-sort-form" ref={formRef} onSubmit={submit} noValidate className="grid gap-5">
        {formError && (
          <div tabIndex={-1} data-form-error>
            <Alert tone="danger" title={t('cardSorting.list.createErrorTitle')}>
              {formError}
            </Alert>
          </div>
        )}
        <TextField
          label={t('cardSorting.list.nameLabel')}
          name="name"
          isRequired
          autoFocus
          maxLength={LIMITS.name}
          hint={t('cardSorting.list.nameHint')}
          value={name}
          onChange={(value) => {
            setError(null);
            setName(value);
          }}
          error={error}
        />
      </form>
    </Dialog>
  );
}
