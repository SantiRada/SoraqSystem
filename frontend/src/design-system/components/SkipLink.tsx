import { useI18n } from '@/i18n';

/** First focusable element of every layout (WCAG 2.4.1). */
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  const { t } = useI18n();

  return (
    <a
      href={`#${targetId}`}
      className="fixed left-3 top-3 z-[100001] -translate-y-[200%] rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background no-underline focus-visible:translate-y-0"
    >
      {t('common.a11y.skipToContent')}
    </a>
  );
}
