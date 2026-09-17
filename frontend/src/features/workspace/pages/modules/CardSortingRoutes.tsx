import { Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';
import { LoadingState } from '@/design-system';
import { paths } from '@/config/paths';
import { CardSortListPage, CardSortStudyPage } from '@/features/card-sorting';
import { useI18n } from '@/i18n';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SectionBreadcrumb } from './SectionBreadcrumb';

/** Navegación → Card Sorting: list of studies. */
export function CardSortListRoute() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  return (
    <Suspense fallback={<LoadingState label={t('cardSorting.list.loading')} />}>
      <CardSortListPage project={project} eyebrow={<SectionBreadcrumb sectionId="navigation" />} studyHref={(studyId) => paths.cardSortStudy(project.id, studyId)} />
    </Suspense>
  );
}

/** Navegación → Card Sorting → one study. */
export function CardSortStudyRoute() {
  const { t } = useI18n();
  const { project } = useWorkspace();
  const { studyId = '' } = useParams();
  const navigate = useNavigate();
  const listHref = paths.projectItem(project.id, 'navigation', 'card-sorting');

  return (
    <Suspense fallback={<LoadingState label={t('cardSorting.study.loading')} />}>
      <CardSortStudyPage studyId={studyId} backHref={listHref} backLabel={t('cardSorting.study.back')} onDeleted={() => navigate(listHref, { replace: true })} />
    </Suspense>
  );
}
