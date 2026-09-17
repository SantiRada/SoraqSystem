import { Link, useLocation } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Alert, Card, PageHeader } from '@/design-system';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { formatDateTime } from '@/shared/i18n/format';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { projectNavigation, sectionItems, type WorkspaceSection } from '../config/projectNavigation';
import { useWorkspace } from '../context/WorkspaceContext';

/** Project home: context + map of every section (primary sidebar stays expanded here). */
export function ProjectOverviewPage() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const location = useLocation();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated === true;
  usePageMeta({ title: project.name, noindex: true });

  return (
    <>
      <PageHeader eyebrow={t('workspace.overview')} title={project.name} description={project.description ?? undefined} />

      {justCreated && (
        <Alert tone="success" title={t('workspace.overviewPage.createdTitle')} className="mb-8">
          {t('workspace.overviewPage.createdDescription')}
        </Alert>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start">
        <section aria-labelledby="sections-title">
          <h2 id="sections-title" className="mb-6 text-xl font-semibold tracking-tight">
            {t('workspace.overviewPage.sectionsTitle')}
          </h2>
          <div className="grid gap-8">
            {projectNavigation.map((group) => (
              <div key={group.id}>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t(group.labelKey)}</h3>
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <SectionCard projectId={project.id} section={section} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <Card className="rounded-3xl border border-border bg-surface p-6">
          <aside aria-labelledby="project-details-title">
            <h2 id="project-details-title" className="mb-4 text-sm font-medium text-muted">
              {t('workspace.overviewPage.detailsTitle')}
            </h2>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted">{t('workspace.overviewPage.created')}</dt>
                <dd>
                  <time dateTime={project.createdAt}>{formatDateTime(project.createdAt)}</time>
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t('workspace.lastUpdated')}</dt>
                <dd>
                  <time dateTime={project.updatedAt}>{formatDateTime(project.updatedAt)}</time>
                </dd>
              </div>
            </dl>
          </aside>
        </Card>
      </div>
    </>
  );
}

function SectionCard({ projectId, section }: { projectId: string; section: WorkspaceSection }) {
  const { t } = useI18n();
  const Icon = section.icon;
  const count = sectionItems(section).length;

  return (
    <Card className="group relative h-full gap-3 rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-border-tertiary hover:bg-surface-secondary focus-within:border-focus">
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
          <Icon className="size-5" />
        </span>
        <ArrowUpRight aria-hidden="true" className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <h4 className="text-base font-semibold">
        <Link
          to={paths.projectSection(projectId, section.id)}
          className="text-foreground no-underline outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
        >
          {t(section.titleKey)}
        </Link>
      </h4>
      <p className="text-sm text-muted">{t(section.descriptionKey)}</p>
      {count > 0 && <p className="mt-auto text-xs text-muted">{t('workspace.overviewPage.itemsCount', { count })}</p>}
    </Card>
  );
}
