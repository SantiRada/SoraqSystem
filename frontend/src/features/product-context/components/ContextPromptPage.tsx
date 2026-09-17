import { useCallback, useState, type ReactNode } from 'react';
import { Copy, RefreshCw, Sparkles, StickyNote } from 'lucide-react';
import { Alert, Button, ButtonLink, Card, EmptyState, LoadingState, PageHeader, Toast } from '@/design-system';
import { projectPermissions, type Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { formatDateTime } from '@/shared/i18n/format';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { productContextApi } from '../api/productContextApi';
import type { ContextPrompt, ProductNote } from '../model/types';

interface PageData {
  prompt: ContextPrompt;
  notes: ProductNote[];
  /** Automatic regeneration on open failed; the previous summary (if any) is still shown. */
  autoError: ApiError | null;
}

interface ContextPromptPageProps {
  project: Project;
  eyebrow?: ReactNode;
  /** Link to Investigación → Producto (owned by the workspace router). */
  notesHref: string;
}

/**
 * Documentación → Context Prompt. On open, editors get the summary refreshed automatically when notes
 * changed (AI configured). Without AI, the prompt falls back to the full notes so it is always usable.
 */
export function ContextPromptPage({ project, eyebrow, notesHref }: ContextPromptPageProps) {
  const { t } = useI18n();
  usePageMeta({ title: `${t('productContext.prompt.title')} · ${project.name}`, noindex: true });

  const canEdit = projectPermissions.canUpdate(project.accessRole);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);
  const hideCopied = useCallback(() => setCopyStatus((current) => (current === 'copied' ? null : current)), []);

  const page = useApiQuery<PageData>(
    async (signal) => {
      const [prompt, notes] = await Promise.all([productContextApi.contextPrompt(project.id, signal), productContextApi.notes(project.id, signal)]);
      if (!(canEdit && prompt.aiConfigured && prompt.noteCount > 0 && prompt.isStale)) return { prompt, notes, autoError: null };

      setAutoGenerating(true);
      try {
        return { prompt: await productContextApi.generateContextPrompt(project.id, signal), notes, autoError: null };
      } catch (error) {
        if (signal.aborted) throw error;
        return { prompt, notes, autoError: error instanceof ApiError ? error : null };
      } finally {
        setAutoGenerating(false);
      }
    },
    [project.id, canEdit],
  );

  async function regenerate() {
    setRegenerating(true);
    setGenerateError(null);
    setCopyStatus(null);
    try {
      const prompt = await productContextApi.generateContextPrompt(project.id);
      page.setData((current) => ({ ...current, prompt, autoError: null }));
    } catch (error) {
      setGenerateError(toUserMessage(error, t));
    } finally {
      setRegenerating(false);
    }
  }

  if (page.status === 'loading') {
    return <LoadingState label={autoGenerating ? t('productContext.prompt.generating') : t('productContext.prompt.loading')} />;
  }

  const header = (actions?: ReactNode) => (
    <PageHeader eyebrow={eyebrow} title={t('productContext.prompt.title')} description={t('productContext.prompt.description')} actions={actions} />
  );

  if (page.status === 'error') {
    return (
      <>
        {header()}
        <Alert
          tone="danger"
          title={t('productContext.prompt.loadErrorTitle')}
          action={
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={page.reload}>
              {t('common.actions.tryAgain')}
            </Button>
          }
        >
          {toUserMessage(page.error, t)}
        </Alert>
      </>
    );
  }

  const { prompt, notes, autoError } = page.data;

  if (notes.length === 0) {
    return (
      <>
        {header()}
        <EmptyState
          className="min-h-[50dvh] justify-center"
          icon={<StickyNote />}
          title={t('productContext.prompt.emptyTitle')}
          description={t('productContext.prompt.emptyDescription')}
          action={
            <ButtonLink to={notesHref} variant="secondary" leadingIcon={<StickyNote />}>
              {t('productContext.prompt.goToNotes')}
            </ButtonLink>
          }
        />
      </>
    );
  }

  // Summary when available; otherwise the full notes, so the prompt is never empty.
  const body = prompt.summary ?? notes.map((note) => `## ${note.title}\n${note.body}`).join('\n\n');
  const promptText = [
    t('productContext.prompt.template.intro', { project: project.name }),
    project.description ? t('productContext.prompt.template.description', { description: project.description }) : null,
    body,
  ]
    .filter(Boolean)
    .join('\n\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  const canRegenerate = canEdit && prompt.aiConfigured;
  const errorMessage = generateError ?? (autoError ? toUserMessage(autoError, t) : null);

  return (
    <>
      {header(
        <>
          {canRegenerate && (
            <Button variant="secondary" leadingIcon={<Sparkles />} isLoading={regenerating} onPress={regenerate}>
              {regenerating ? t('productContext.prompt.regenerating') : t('productContext.prompt.regenerate')}
            </Button>
          )}
          <Button variant="contrast" leadingIcon={<Copy />} onPress={copy} isDisabled={regenerating}>
            {t('productContext.prompt.copy')}
          </Button>
        </>,
      )}

      <Toast message={t('productContext.prompt.copied')} isVisible={copyStatus === 'copied'} onDismiss={hideCopied} />

      <div className="grid grid-cols-1 gap-6">
        {copyStatus === 'failed' && <Alert tone="warning">{t('productContext.prompt.copyFailed')}</Alert>}

        {errorMessage && (
          <Alert tone="danger" title={t('productContext.prompt.generateErrorTitle')}>
            {errorMessage}
          </Alert>
        )}

        {!prompt.aiConfigured && (
          <Alert tone="info" title={t('productContext.prompt.notConfiguredTitle')}>
            {t('productContext.prompt.notConfigured')}
          </Alert>
        )}

        {prompt.aiConfigured && prompt.summary !== null && prompt.isStale && !regenerating && (
          <Alert
            tone="warning"
            title={t('productContext.prompt.staleTitle')}
            action={
              canRegenerate ? (
                <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={regenerate}>
                  {t('productContext.prompt.regenerate')}
                </Button>
              ) : undefined
            }
          >
            {canEdit ? t('productContext.prompt.stale') : t('productContext.prompt.staleReadOnly')}
          </Alert>
        )}

        <Card className="min-w-0 gap-4 rounded-3xl border border-border bg-surface p-5 md:p-6">
          <section aria-labelledby="context-prompt-heading" className="grid min-w-0 grid-cols-1 gap-4">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="context-prompt-heading" className="text-base font-semibold">
                {prompt.summary !== null ? t('productContext.prompt.previewLabel') : t('productContext.prompt.fullNotesTitle')}
              </h2>
              {prompt.summary !== null && prompt.generatedAt && (
                <p className="text-xs text-muted">
                  {t('productContext.prompt.meta', {
                    notes: t('productContext.prompt.summarizedNotes', { count: prompt.summarizedNoteCount }),
                    date: formatDateTime(prompt.generatedAt),
                  })}
                </p>
              )}
            </header>
            <pre
              aria-labelledby="context-prompt-heading"
              aria-busy={regenerating}
              className="max-h-[65dvh] min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-2xl bg-surface-secondary p-4 font-mono text-[13px] leading-relaxed text-foreground [overflow-wrap:anywhere]"
            >
              {promptText}
            </pre>
          </section>
        </Card>
      </div>
    </>
  );
}
