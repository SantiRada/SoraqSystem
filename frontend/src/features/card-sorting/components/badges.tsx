import { Badge, type BadgeTone } from '@/design-system';
import { useI18n } from '@/i18n';
import type { SortType, StudyStatus } from '../model/types';

const statusTone: Record<StudyStatus, BadgeTone> = { draft: 'neutral', active: 'success', paused: 'warning', closed: 'danger' };

export function StatusBadge({ status }: { status: StudyStatus }) {
  const { t } = useI18n();
  return <Badge tone={statusTone[status]}>{t(`cardSorting.status.${status}`)}</Badge>;
}

export function TypeBadge({ type }: { type: SortType }) {
  const { t } = useI18n();
  return <Badge>{t(`cardSorting.types.${type}`)}</Badge>;
}
