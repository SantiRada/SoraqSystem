import { useState } from 'react';
import { Copy, ExternalLink, Lock, Pause, Play, Send } from 'lucide-react';
import { Button, ButtonAnchor, Card, Dialog } from '@/design-system';
import { useI18n } from '@/i18n';
import type { StatusAction, Study } from '../model/types';

interface StudyStatusBarProps {
  study: Study;
  canEdit: boolean;
  /** Pause / resume run directly; publish and close ask first (see StatusConfirmDialog). */
  onAction: (action: StatusAction) => Promise<void>;
  onRequestConfirm: (action: 'publish' | 'close') => void;
  onCopied: () => void;
}

/** Participant link + lifecycle actions: publish (draft) · pause / resume · close (definitive). */
export function StudyStatusBar({ study, canEdit, onAction, onRequestConfirm, onCopied }: StudyStatusBarProps) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<StatusAction | null>(null);
  const url = study.publicPath ? `${window.location.origin}${study.publicPath}` : null;

  async function run(action: StatusAction) {
    setBusy(action);
    await onAction(action).catch(() => undefined); // the page shows the error
    setBusy(null);
  }

  const hint =
    study.status === 'draft' ? t('studies.study.draftHint') : study.status === 'paused' ? t('studies.study.pausedHint') : study.status === 'closed' ? t('studies.study.closedHint') : null;

  return (
    <Card className="rounded-3xl border border-border bg-surface p-5">
      <section aria-labelledby="study-link-title" className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 id="study-link-title" className="text-sm font-semibold">
            {t('studies.study.linkLabel')}
          </h2>
          {url && (
            <p className="truncate font-mono text-sm text-muted" title={url}>
              {url}
            </p>
          )}
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>

        <div className="flex flex-wrap gap-2 xl:shrink-0 xl:flex-nowrap [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap">
          {url && study.status !== 'closed' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<Copy />}
                onPress={async () => {
                  await navigator.clipboard.writeText(url).catch(() => undefined);
                  onCopied();
                }}
              >
                {t('studies.study.copyLink')}
              </Button>
              <ButtonAnchor href={url} newTab variant="ghost" size="sm" leadingIcon={<ExternalLink />}>
                {t('studies.study.openLink')}
              </ButtonAnchor>
            </>
          )}
          {canEdit && study.status === 'draft' && (
            <Button variant="primary" size="sm" leadingIcon={<Send />} onPress={() => onRequestConfirm('publish')}>
              {t('studies.study.publish')}
            </Button>
          )}
          {canEdit && study.status === 'active' && (
            <Button variant="secondary" size="sm" leadingIcon={<Pause />} isLoading={busy === 'pause'} onPress={() => void run('pause')}>
              {t('studies.study.pause')}
            </Button>
          )}
          {canEdit && study.status === 'paused' && (
            <Button variant="contrast" size="sm" leadingIcon={<Play />} isLoading={busy === 'resume'} onPress={() => void run('resume')}>
              {t('studies.study.resume')}
            </Button>
          )}
          {canEdit && (study.status === 'active' || study.status === 'paused') && (
            <Button variant="danger" size="sm" leadingIcon={<Lock />} onPress={() => onRequestConfirm('close')}>
              {t('studies.study.close')}
            </Button>
          )}
        </div>
      </section>
    </Card>
  );
}

interface StatusConfirmDialogProps {
  action: 'publish' | 'close' | null;
  studyName: string;
  dirty: boolean;
  onCancel: () => void;
  onConfirm: (action: 'publish' | 'close') => Promise<void>;
}

/** Confirmation for publishing (generates the link) and closing (definitive). */
export function StatusConfirmDialog({ action, studyName, dirty, onCancel, onConfirm }: StatusConfirmDialogProps) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!action) return;
    setBusy(true);
    await onConfirm(action).catch(() => undefined);
    setBusy(false);
  };

  return (
    <Dialog
      isOpen={action !== null}
      onClose={onCancel}
      isDismissable={!busy}
      title={action === 'close' ? t('studies.study.closeDialogTitle', { name: studyName }) : t('studies.study.publishDialogTitle', { name: studyName })}
      description={action === 'close' ? t('studies.study.closeDialogDescription') : t('studies.study.publishDialogDescription')}
      footer={
        <>
          <Button variant="ghost" onPress={onCancel} isDisabled={busy}>
            {t('common.actions.cancel')}
          </Button>
          {action === 'close' ? (
            <Button variant="danger" leadingIcon={<Lock />} isLoading={busy} onPress={confirm}>
              {t('studies.study.closeConfirm')}
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<Send />} isLoading={busy} onPress={confirm}>
              {busy ? t('studies.study.publishing') : t('studies.study.publish')}
            </Button>
          )}
        </>
      }
    >
      {action === 'publish' && dirty ? <p className="text-sm text-muted">{t('studies.study.publishUnsaved')}</p> : undefined}
    </Dialog>
  );
}
