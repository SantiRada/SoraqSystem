import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FolderPlus, Plus, RefreshCw } from 'lucide-react';
import { Alert, Button, EmptyState, LoadingState, PageHeader } from '@/design-system';
import { paths } from '@/config/paths';
import { SharedStudiesSection } from '@/features/card-sorting';
import { useI18n } from '@/i18n';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { toUserMessage } from '@/shared/api/ApiError';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { projectsApi } from '../api/projectsApi';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { ProjectCard } from '../components/ProjectCard';

export function ProjectsPage() {
  const { t } = useI18n();
  usePageMeta({ title: t('projects.list.metaTitle'), noindex: true });
  const navigate = useNavigate();
  const location = useLocation();
  // Feedback after deleting or leaving a project in the workspace (Peak-End).
  const exitState = location.state as { deletedProject?: string; leftProject?: string } | null;
  const [creating, setCreating] = useState(false);
  const projects = useApiQuery((signal) => projectsApi.list(signal), []);

  const hasProjects = projects.status === 'success' && projects.data.length > 0;

  return (
    <>
      <PageHeader
        title={t('projects.list.title')}
        description={
          hasProjects ? `${t('projects.list.description')} · ${t('projects.list.count', { count: projects.data.length })}` : t('projects.list.description')
        }
        actions={
          hasProjects && (
            <Button variant="contrast" leadingIcon={<Plus />} onPress={() => setCreating(true)}>
              {t('projects.list.newProject')}
            </Button>
          )
        }
      />

      {exitState?.deletedProject && (
        <Alert tone="success" title={t('projects.list.deletedTitle')} className="mb-6">
          {t('projects.list.deletedDescription', { name: exitState.deletedProject })}
        </Alert>
      )}
      {exitState?.leftProject && (
        <Alert tone="success" title={t('projects.list.leftTitle')} className="mb-6">
          {t('projects.list.leftDescription', { name: exitState.leftProject })}
        </Alert>
      )}

      {projects.status === 'loading' && <LoadingState label={t('projects.list.loading')} />}

      {projects.status === 'error' && (
        <Alert
          tone="danger"
          title={t('projects.list.errorTitle')}
          action={
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={projects.reload}>
              {t('common.actions.tryAgain')}
            </Button>
          }
        >
          {toUserMessage(projects.error, t)}
        </Alert>
      )}

      {projects.status === 'success' && projects.data.length === 0 && (
        <EmptyState
          icon={<FolderPlus />}
          title={t('projects.list.emptyTitle')}
          description={t('projects.list.emptyDescription')}
          action={
            <Button variant="contrast" leadingIcon={<Plus />} onPress={() => setCreating(true)}>
              {t('projects.list.newProject')}
            </Button>
          }
        />
      )}

      {hasProjects && (
        <section aria-label={t('projects.list.regionLabel')}>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
            {projects.data.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <SharedStudiesSection />

      <CreateProjectDialog
        isOpen={creating}
        onClose={() => setCreating(false)}
        onCreated={(project) => {
          setCreating(false);
          navigate(paths.project(project.id), { state: { justCreated: true } });
        }}
      />
    </>
  );
}
