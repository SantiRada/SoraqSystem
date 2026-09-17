import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { cardSortingApi } from '../api/cardSortingApi';
import { StudyGrid } from '../components/StudyGrid';

/** Projects page: studies other teams shared with the user in read-only mode. Hidden when there are none. */
export function SharedStudiesSection() {
  const { t } = useI18n();
  const shared = useApiQuery((signal) => cardSortingApi.shared(signal), []);

  if (shared.status !== 'success' || shared.data.length === 0) return null;

  return (
    <section aria-labelledby="shared-studies-heading" className="mt-12 grid gap-4">
      <header>
        <h2 id="shared-studies-heading" className="text-xl font-semibold tracking-tight">
          {t('cardSorting.list.sharedTitle')}
        </h2>
        <p className="text-sm text-muted">{t('cardSorting.list.sharedDescription')}</p>
      </header>
      <StudyGrid studies={shared.data} studyHref={paths.sharedCardSort} showProject />
    </section>
  );
}
