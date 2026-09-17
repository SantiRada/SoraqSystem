import { useNavigate, useParams } from 'react-router';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { StudyPage } from './StudyPage';

/** A study opened through read-only sharing (the viewer has no access to its project). */
export function SharedStudyPage() {
  const { t } = useI18n();
  const { studyId = '' } = useParams();
  const navigate = useNavigate();

  return <StudyPage studyId={studyId} backHref={paths.projects} backLabel={t('cardSorting.study.backToProjects')} onDeleted={() => navigate(paths.projects, { replace: true })} />;
}
