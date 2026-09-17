import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useBlocker, useSearchParams } from 'react-router';
import { ArrowLeft, RefreshCw, SearchX } from 'lucide-react';
import { Alert, Button, ButtonLink, Dialog, EmptyState, LoadingState, PageHeader, Tabs, Toast, type ToastTone } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { cardSortingApi } from '../api/cardSortingApi';
import { ContentTab } from '../components/content/ContentTab';
import { ReportTab } from '../components/report/ReportTab';
import { SettingsTab } from '../components/settings/SettingsTab';
import { isEmptyCard } from '../components/content/CardsStep';
import { StatusConfirmDialog, StudyStatusBar } from '../components/StudyStatusBar';
import { StatusBadge, TypeBadge } from '../components/badges';
import type { StatusAction, Study, StudyDocument } from '../model/types';

export type FieldErrors = Record<string, string>;

interface StudyPageProps {
  studyId: string;
  backHref: string;
  backLabel: string;
  /** Called after the study is deleted (navigate away). */
  onDeleted: () => void;
}

const TABS = ['content', 'report', 'settings'] as const;
type Tab = (typeof TABS)[number];

export function toDocument(study: Study): StudyDocument {
  const { name, sortType, purpose, participantRequirements, cardsHaveDescriptions, randomizeCards, randomizeCategories, cards, categories, flow, settings } = study;
  return { name, sortType, purpose, participantRequirements, cardsHaveDescriptions, randomizeCards, randomizeCategories, cards, categories, flow, settings };
}

/** Dashboard of one Card Sorting study: Contenido · Reporte · Configuración (Reporte appears once published). */
export function StudyPage({ studyId, backHref, backLabel, onDeleted }: StudyPageProps) {
  const { t } = useI18n();
  const query = useApiQuery((signal) => cardSortingApi.get(studyId, signal), [studyId]);

  if (query.status === 'loading') return <LoadingState label={t('cardSorting.study.loading')} />;

  if (query.status === 'error') {
    return query.error.kind === 'not_found' ? (
      <EmptyState
        className="min-h-[60dvh] justify-center"
        icon={<SearchX />}
        headingLevel="h1"
        title={t('cardSorting.study.notFoundTitle')}
        description={t('cardSorting.study.notFoundDescription')}
        action={
          <ButtonLink to={backHref} variant="secondary" leadingIcon={<ArrowLeft />}>
            {backLabel}
          </ButtonLink>
        }
      />
    ) : (
      <Alert
        tone="danger"
        title={t('cardSorting.study.loadErrorTitle')}
        action={
          <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={query.reload}>
            {t('common.actions.tryAgain')}
          </Button>
        }
      >
        {toUserMessage(query.error, t)}
      </Alert>
    );
  }

  return <StudyDashboard key={query.data.id} initial={query.data} backHref={backHref} backLabel={backLabel} onDeleted={onDeleted} />;
}

function StudyDashboard({ initial, backHref, backLabel, onDeleted }: { initial: Study; backHref: string; backLabel: string; onDeleted: () => void }) {
  const { t } = useI18n();
  const [study, setStudy] = useState(initial);
  const [document, setDocument] = useState<StudyDocument>(() => toDocument(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToastState] = useState<{ message: string; tone: ToastTone } | null>(null);
  const setToast = useCallback((message: string | null, tone: ToastTone = 'success') => setToastState(message === null ? null : { message, tone }), []);
  const [confirm, setConfirm] = useState<'publish' | 'close' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  usePageMeta({ title: study.name, noindex: true });

  const canEdit = study.permissions.canEdit;
  const saved = useMemo(() => JSON.stringify(toDocument(study)), [study]);
  const dirty = canEdit && JSON.stringify(document) !== saved;

  const availableTabs: Tab[] = study.status === 'draft' ? ['content', 'settings'] : [...TABS];
  const requested = searchParams.get('tab') as Tab | null;
  const tab: Tab = requested && availableTabs.includes(requested) ? requested : 'content';

  const update = useCallback((recipe: (draft: StudyDocument) => StudyDocument) => setDocument((current) => recipe(current)), []);

  const applyError = (error: unknown) => {
    if (error instanceof ApiError && error.kind === 'validation') {
      setErrors(error.fields);
      const message = t('cardSorting.save.fieldErrors', { count: Object.keys(error.fields).length });
      setSaveError(message);
      setToast(message, 'danger');
    } else {
      setSaveError(toUserMessage(error, t));
      setToast(toUserMessage(error, t), 'danger');
    }
  };

  async function save(): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    try {
      // Empty cards / categories are never saved.
      const clean = { ...document, cards: document.cards.filter((c) => !isEmptyCard(c)), categories: document.categories.filter((c) => c.label.trim() !== '') };
      const next = await cardSortingApi.save(study.id, clean);
      setStudy(next);
      setDocument(toDocument(next));
      setErrors({});
      setToast(t('cardSorting.save.saved'));
      return true;
    } catch (error) {
      applyError(error);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(action: StatusAction) {
    if (dirty && !(await save())) return;
    setSaveError(null);
    try {
      const next = await cardSortingApi.changeStatus(study.id, action);
      setStudy(next);
      setDocument(toDocument(next));
      setToast(t(`cardSorting.study.${action === 'publish' ? 'published' : action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'closedNotice'}`));
    } catch (error) {
      applyError(error);
      throw error;
    }
  }

  // Unsaved changes: confirm before leaving inside the app, and let the browser warn on reload/close.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const hideToast = useCallback(() => setToast(null), [setToast]);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={backHref} className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-foreground">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {backLabel}
          </Link>
        }
        title={study.name}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={study.status} />
            <TypeBadge type={study.sortType} />
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 pb-24">
        {!canEdit && (
          <Alert tone="info" title={t('cardSorting.study.readOnlyTitle')}>
            {t('cardSorting.study.readOnly')}
          </Alert>
        )}

        <StudyStatusBar study={study} canEdit={canEdit} onAction={changeStatus} onRequestConfirm={setConfirm} onCopied={() => setToast(t('cardSorting.study.linkCopied'))} />

        {saveError && (
          <Alert tone="danger" title={t('cardSorting.save.errorTitle')}>
            {saveError}
          </Alert>
        )}

        <Tabs selectedKey={tab} onSelectionChange={(key) => setSearchParams((params) => (params.set('tab', String(key)), params), { replace: true })} className="w-full">
          <Tabs.ListContainer className="overflow-x-auto">
            <Tabs.List aria-label={t('cardSorting.study.tabsLabel')}>
              {availableTabs.map((id) => (
                <Tabs.Tab key={id} id={id} className="whitespace-nowrap">
                  {t(`cardSorting.study.tabs.${id}`)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="content" className="pt-6">
            <ContentTab document={document} update={update} errors={errors} readOnly={!canEdit} isDraft={study.status === 'draft'} onPublish={() => setConfirm('publish')} />
          </Tabs.Panel>
          {study.status !== 'draft' && (
            <Tabs.Panel id="report" className="pt-6">
              <ReportTab study={study} />
            </Tabs.Panel>
          )}
          <Tabs.Panel id="settings" className="pt-6">
            <SettingsTab
              study={study}
              document={document}
              update={update}
              errors={errors}
              readOnly={!canEdit}
              onResultsDeleted={() => {
                setStudy((s) => ({ ...s, responseCount: 0 }));
                setToast(t('cardSorting.settings.resultsDeleted'));
              }}
              onDeleted={onDeleted}
            />
          </Tabs.Panel>
        </Tabs>
      </div>

      {dirty && (
        <SaveBar
          saving={saving}
          onDiscard={() => {
            setDocument(toDocument(study));
            setErrors({});
            setSaveError(null);
          }}
          onSave={() => void save()}
        />
      )}

      <Toast message={toast?.message ?? ''} tone={toast?.tone} isVisible={toast !== null} onDismiss={hideToast} />

      <StatusConfirmDialog
        action={confirm}
        studyName={study.name}
        dirty={dirty}
        onCancel={() => setConfirm(null)}
        onConfirm={async (action) => {
          try {
            await changeStatus(action);
          } finally {
            setConfirm(null);
          }
        }}
      />

      {/* Leaving with unsaved changes. The × keeps editing. */}
      <Dialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => !leaving && blocker.reset?.()}
        isDismissable={!leaving}
        title={t('cardSorting.save.leaveTitle')}
        description={t('cardSorting.save.leaveDescription')}
        footer={
          <>
            <Button variant="ghost" onPress={() => blocker.proceed?.()} isDisabled={leaving}>
              {t('cardSorting.save.leaveConfirm')}
            </Button>
            <Button
              variant="contrast"
              autoFocus
              isLoading={leaving}
              onPress={async () => {
                setLeaving(true);
                const ok = await save();
                setLeaving(false);
                if (ok) blocker.proceed?.();
                else blocker.reset?.();
              }}
            >
              {t('cardSorting.save.saveAndLeave')}
            </Button>
          </>
        }
      />
    </>
  );
}

function SaveBar({ saving, onDiscard, onSave }: { saving: boolean; onDiscard: () => void; onSave: () => void }): ReactNode {
  const { t } = useI18n();

  // Portal: always fixed to the viewport, above page content, whatever the scroll or layout.
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[150] flex justify-center px-4 transition-[opacity,translate] duration-200 starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none">
      <div role="region" aria-label={t('cardSorting.save.unsaved')} className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-overlay py-2 pe-2 ps-4 shadow-lg shadow-black/20">
        <p className="text-sm font-medium">{t('cardSorting.save.unsaved')}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onPress={onDiscard} isDisabled={saving}>
            {t('cardSorting.save.discard')}
          </Button>
          <Button variant="contrast" size="sm" onPress={onSave} isLoading={saving}>
            {saving ? t('cardSorting.save.saving') : t('cardSorting.save.save')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
