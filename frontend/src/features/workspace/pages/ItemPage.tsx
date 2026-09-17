import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Badge, EmptyState, PageHeader } from '@/design-system';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { findItem, findSection } from '../config/projectNavigation';
import { useWorkspace } from '../context/WorkspaceContext';
import { SectionNotFound } from './SectionPage';

/**
 * Level 3+ page: the content space of a creatable item.
 * Placeholder until each module is built — modules replace this page by mounting their own route.
 */
export function ItemPage() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const { sectionId, itemId } = useParams();
  const found = findSection(sectionId);
  const item = found ? findItem(found.section, itemId) : null;

  usePageMeta({ title: item ? `${t(item.labelKey)} · ${project.name}` : t('workspace.sectionNotFoundTitle'), noindex: true });

  if (!found || !item) return <SectionNotFound projectId={project.id} />;

  const { section } = found;
  const Icon = section.icon;
  const itemLabel = t(item.labelKey);

  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label={t('common.a11y.breadcrumb')}>
            <Link to={paths.projectSection(project.id, section.id)} className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-foreground">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t(section.titleKey)}
            </Link>
          </nav>
        }
        title={itemLabel}
        actions={<Badge>{t('workspace.status.notStarted')}</Badge>}
      />

      <EmptyState
        className="min-h-[60dvh] justify-center"
        icon={<Icon />}
        title={t('workspace.itemPage.comingSoonTitle', { item: itemLabel })}
        description={t('workspace.itemPage.comingSoonDescription')}
      />
    </>
  );
}
