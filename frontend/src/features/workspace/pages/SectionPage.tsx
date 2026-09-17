import { Link, useParams } from 'react-router';
import { ArrowLeft, CircleDashed, Compass } from 'lucide-react';
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from '@/design-system';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { findSection, isSubgroup, type WorkspaceItem, type WorkspaceSection } from '../config/projectNavigation';
import { useWorkspace } from '../context/WorkspaceContext';

/** Level 2 page: section overview and the items that can be created inside it. */
export function SectionPage() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const { sectionId } = useParams();
  const found = findSection(sectionId);

  usePageMeta({ title: found ? `${t(found.section.titleKey)} · ${project.name}` : t('workspace.sectionNotFoundTitle'), noindex: true });

  if (!found) return <SectionNotFound projectId={project.id} />;

  const { group, section } = found;
  const Icon = section.icon;
  const looseItems = section.children.filter((child): child is WorkspaceItem => !isSubgroup(child));
  const subgroups = section.children.filter(isSubgroup);

  return (
    <>
      <PageHeader eyebrow={t(group.labelKey)} title={t(section.titleKey)} description={t(section.descriptionKey)} />

      {section.children.length === 0 ? (
        <EmptyState
          className="min-h-[50dvh] justify-center"
          icon={<Icon />}
          title={t('workspace.sectionPage.comingSoonTitle', { section: t(section.titleKey) })}
          description={t('workspace.sectionPage.comingSoonDescription')}
        />
      ) : (
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="mb-6 text-xl font-semibold tracking-tight">
            {t('workspace.sectionPage.itemsTitle')}
          </h2>
          <div className="grid gap-8">
            {looseItems.length > 0 && <ItemGrid projectId={project.id} section={section} items={looseItems} />}
            {subgroups.map((subgroup) => (
              <div key={subgroup.id}>
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t(subgroup.labelKey)}</h3>
                <ItemGrid projectId={project.id} section={section} items={subgroup.items} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ItemGrid({ projectId, section, items }: { projectId: string; section: WorkspaceSection; items: WorkspaceItem[] }) {
  const { t } = useI18n();

  return (
    <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="relative h-full flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-tertiary hover:bg-surface-secondary focus-within:border-focus">
            {item.icon ? <item.icon aria-hidden="true" className="size-5 shrink-0 text-accent-soft-foreground" /> : <CircleDashed aria-hidden="true" className="size-5 shrink-0 text-muted" />}
            <Link
              to={paths.projectItem(projectId, section.id, item.id)}
              className="min-w-0 flex-1 truncate text-sm font-medium text-foreground no-underline outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
            >
              {t(item.labelKey)}
            </Link>
            {!item.icon && <Badge>{t('workspace.status.notStarted')}</Badge>}
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function SectionNotFound({ projectId }: { projectId: string }) {
  const { t } = useI18n();

  return (
    <EmptyState
      icon={<Compass />}
      headingLevel="h1"
      title={t('workspace.sectionNotFoundTitle')}
      description={t('workspace.sectionNotFoundDescription')}
      action={
        <ButtonLink to={paths.project(projectId)} variant="secondary" leadingIcon={<ArrowLeft />}>
          {t('workspace.backToOverview')}
        </ButtonLink>
      }
    />
  );
}
