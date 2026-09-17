import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, RotateCcw, Trash2, UserPlus, X } from 'lucide-react';
import { Alert, Button, Card, ColorPickerField, IconButton, LoadingState, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { focusFirstInvalid } from '@/shared/forms/focusFirstInvalid';
import { cn } from '@/shared/lib/cn';
import { cardSortingApi } from '../model/types';
import { LIMITS, SOCIAL_NETWORKS, type Study, type StudyDocument, type StudySettings } from '../model/types';
import type { FieldErrors } from '../model/types';
import { ACCENT_PRESETS, SORAQ_ACCENT, SocialIcon, readableForeground } from '../components/shared';

interface SettingsTabProps {
  study: Study;
  document: StudyDocument;
  update: (recipe: (draft: StudyDocument) => StudyDocument) => void;
  errors: FieldErrors;
  readOnly: boolean;
  onResultsDeleted: () => void;
  onDeleted: () => void;
}

/** Configuración: look & feel of the participant flow, read-only sharing and destructive actions. */
export function SettingsTab({ study, document, update, errors, readOnly, onResultsDeleted, onDeleted }: SettingsTabProps) {
  const { t } = useI18n();
  const settings = document.settings;
  const setSettings = (patch: Partial<StudySettings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const accent = settings.accentColor ?? SORAQ_ACCENT;

  return (
    <div className="grid gap-6">
      <Panel id="settings-buttons" title={t('studies.settings.buttonsTitle')} description={t('studies.settings.buttonsDescription')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t('studies.settings.continueLabel')}
            name="continueLabel"
            isRequired
            isDisabled={readOnly}
            maxLength={LIMITS.buttonLabel}
            value={settings.continueLabel}
            onChange={(continueLabel) => setSettings({ continueLabel })}
            error={errors['settings.continueLabel']}
          />
          <TextField
            label={t('studies.settings.finishLabel')}
            name="finishLabel"
            isRequired
            isDisabled={readOnly}
            maxLength={LIMITS.buttonLabel}
            value={settings.finishLabel}
            onChange={(finishLabel) => setSettings({ finishLabel })}
            error={errors['settings.finishLabel']}
          />
        </div>
      </Panel>

      <Panel id="settings-accent" title={t('studies.settings.accentTitle')} description={t('studies.settings.accentDescription')}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid content-start gap-3">
            {readOnly ? (
              <p className="flex items-center gap-3 font-mono text-sm uppercase">
                <span aria-hidden="true" className="size-8 rounded-xl border border-border" style={{ backgroundColor: accent }} />
                {accent}
              </p>
            ) : (
              <ColorPickerField label={t('studies.settings.accentLabel')} value={accent} presets={ACCENT_PRESETS} onChange={(accentColor) => setSettings({ accentColor })} />
            )}
            {!readOnly && settings.accentColor && (
              <div>
                <Button variant="ghost" size="sm" leadingIcon={<RotateCcw />} onPress={() => setSettings({ accentColor: null })}>
                  {t('studies.settings.accentReset')}
                </Button>
              </div>
            )}
          </div>
          <AccentPreview accent={accent} continueLabel={settings.continueLabel} />
        </div>
      </Panel>

      <Panel id="settings-social" title={t('studies.settings.socialTitle')} description={t('studies.settings.socialDescription')}>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <li key={network} className="flex items-start gap-3">
              <span className="mt-8 grid size-9 shrink-0 place-items-center rounded-xl bg-default text-foreground">
                <SocialIcon network={network} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <TextField
                  label={t(`studies.social.${network}`)}
                  name={`social-${network}`}
                  isDisabled={readOnly}
                  maxLength={LIMITS.socialUrl}
                  placeholder="https://"
                  value={settings.socialLinks[network] ?? ''}
                  onChange={(value) =>
                    setSettings({
                      socialLinks: Object.fromEntries(Object.entries({ ...settings.socialLinks, [network]: value }).filter(([, url]) => url !== '')),
                    })
                  }
                  error={errors[`settings.socialLinks.${network}`]}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">{t('studies.settings.socialHint')}</p>
      </Panel>

      {study.permissions.canManageSharing && <SharingPanel studyId={study.id} />}

      {!readOnly && <DangerZone study={study} onResultsDeleted={onResultsDeleted} onDeleted={onDeleted} />}
    </div>
  );
}

function Panel({ id, title, description, tone, children }: { id: string; title: string; description?: string; tone?: 'danger'; children: ReactNode }) {
  return (
    <Card className={cn('gap-5 rounded-3xl border bg-surface p-5 md:p-6', tone === 'danger' ? 'border-danger/60' : 'border-border')}>
      <section aria-labelledby={id} className="grid gap-5">
        <header>
          <h3 id={id} className={cn('text-base font-semibold', tone === 'danger' && 'text-danger')}>
            {title}
          </h3>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </header>
        {children}
      </section>
    </Card>
  );
}

/** Shows the accent applied to a button and a selected option, with a readable foreground. */
function AccentPreview({ accent, continueLabel }: { accent: string; continueLabel: string }) {
  const { t } = useI18n();
  const foreground = readableForeground(accent);

  return (
    <div className="grid content-start gap-3 rounded-2xl border border-border bg-background p-4">
      <p className="text-xs text-muted">{t('studies.settings.accentPreview')}</p>
      {/* Accent values are validated #rrggbb; CSS variables keep the preview token-driven. */}
      <div className="grid gap-3" style={{ '--preview-accent': accent, '--preview-fg': foreground } as React.CSSProperties}>
        <span aria-hidden="true" className="inline-flex w-fit items-center rounded-full bg-[var(--preview-accent)] px-5 py-2 text-sm font-medium text-[var(--preview-fg)]">
          {continueLabel || '—'}
        </span>
        <span aria-hidden="true" className="flex items-center gap-3 rounded-xl border-2 border-[var(--preview-accent)] px-3 py-2 text-sm">
          <span className="grid size-4 place-items-center rounded-full bg-[var(--preview-accent)] text-[var(--preview-fg)]">
            <Check className="size-3" />
          </span>
          {t('studies.settings.accentOption')}
        </span>
      </div>
    </div>
  );
}

function SharingPanel({ studyId }: { studyId: string }) {
  const { t } = useI18n();
  const viewers = useApiQuery((signal) => cardSortingApi.viewers(studyId, signal), [studyId]);
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (!email.trim()) return;
    setBusy(true);
    try {
      const list = await cardSortingApi.addViewer(studyId, email.trim());
      viewers.setData(() => list);
      const added = list.find((v) => v.email.toLowerCase() === email.trim().toLowerCase());
      setStatus(t('studies.settings.sharingAdded', { name: added?.displayName ?? email.trim() }));
      setEmail('');
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError && err.kind === 'validation' ? (err.fields.email ?? toUserMessage(err, t)) : toUserMessage(err, t));
      focusFirstInvalid(formRef.current);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel id="settings-sharing" title={t('studies.settings.sharingTitle')} description={t('studies.settings.sharingDescription')}>
      <form ref={formRef} onSubmit={add} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <TextField
            label={t('studies.settings.sharingEmail')}
            name="viewer-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(value) => {
              setError(null);
              setEmail(value);
            }}
            error={error}
          />
        </div>
        <Button type="submit" variant="secondary" className="sm:mt-[31px]" leadingIcon={<UserPlus />} isLoading={busy}>
          {busy ? t('studies.settings.sharingAdding') : t('studies.settings.sharingAdd')}
        </Button>
      </form>
      <p className="-mt-3 text-sm text-muted">{t('studies.settings.sharingEmailHint')}</p>
      <p role="status" className={status ? 'text-sm text-success' : 'sr-only'}>
        {status}
      </p>

      {viewers.status === 'loading' && <LoadingState label={t('studies.settings.sharingLoading')} />}
      {viewers.status === 'error' && <Alert tone="danger">{toUserMessage(viewers.error, t)}</Alert>}
      {viewers.status === 'success' &&
        (viewers.data.length === 0 ? (
          <p className="text-sm text-muted">{t('studies.settings.sharingEmpty')}</p>
        ) : (
          <ul className="grid list-none gap-2 p-0">
            {viewers.data.map((viewer) => (
              <li key={viewer.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{viewer.displayName}</span>
                  <span className="block truncate text-xs text-muted">{viewer.email}</span>
                </span>
                <IconButton
                  size="sm"
                  label={t('studies.settings.sharingRemove', { name: viewer.displayName })}
                  icon={<X />}
                  onPress={async () => {
                    await cardSortingApi.removeViewer(studyId, viewer.id).catch(() => undefined);
                    viewers.setData((list) => list.filter((v) => v.id !== viewer.id));
                  }}
                />
              </li>
            ))}
          </ul>
        ))}
    </Panel>
  );
}

function DangerZone({ study, onResultsDeleted, onDeleted }: { study: Study; onResultsDeleted: () => void; onDeleted: () => void }) {
  const { t } = useI18n();

  return (
    <Panel id="settings-danger" tone="danger" title={t('studies.settings.dangerTitle')}>
      <ConfirmByName
        id="delete-results"
        name={study.name}
        title={t('studies.settings.deleteResultsTitle')}
        description={t('studies.settings.deleteResultsDescription')}
        submitLabel={t('studies.settings.deleteResults')}
        onConfirm={async (confirmName) => {
          await cardSortingApi.deleteResponses(study.id, confirmName);
          onResultsDeleted();
        }}
      />
      <ConfirmByName
        id="delete-study"
        name={study.name}
        title={t('studies.settings.deleteStudyTitle')}
        description={t('studies.settings.deleteStudyDescription')}
        submitLabel={t('studies.settings.deleteStudy')}
        onConfirm={async (confirmName) => {
          await cardSortingApi.remove(study.id, confirmName);
          onDeleted();
        }}
      />
    </Panel>
  );
}

function ConfirmByName({
  id,
  name,
  title,
  description,
  submitLabel,
  onConfirm,
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  submitLabel: string;
  onConfirm: (confirmName: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value !== name) {
      setError(t('studies.settings.mismatch'));
      focusFirstInvalid(formRef.current);
      return;
    }
    setBusy(true);
    try {
      await onConfirm(value);
      setValue('');
      setError(null);
    } catch (err) {
      setError(toUserMessage(err, t));
      focusFirstInvalid(formRef.current);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="grid gap-3 rounded-2xl border border-border p-4">
      <div>
        <h4 id={`${id}-title`} className="text-sm font-semibold">
          {title}
        </h4>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <TextField
            label={t('studies.settings.confirmLabel', { name })}
            name={`${id}-confirm`}
            autoComplete="off"
            value={value}
            onChange={(next) => {
              setError(null);
              setValue(next);
            }}
            error={error}
          />
        </div>
        <Button type="submit" variant="danger" className="sm:mt-[31px]" leadingIcon={<Trash2 />} isLoading={busy} isDisabled={value !== name}>
          {busy ? t('studies.settings.deleting') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
