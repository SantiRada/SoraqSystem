import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { findSection } from '../../config/projectNavigation';
import { useWorkspace } from '../../context/WorkspaceContext';

/** "← Section" link shown above a module page (same pattern as ItemPage). */
export function SectionBreadcrumb({ sectionId }: { sectionId: string }) {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const found = findSection(sectionId);
  if (!found) return null;

  return (
    <nav aria-label={t('common.a11y.breadcrumb')}>
      <Link to={paths.projectSection(project.id, sectionId)} className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t(found.section.titleKey)}
      </Link>
    </nav>
  );
}
