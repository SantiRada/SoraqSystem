import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { Alert, Button, LoadingState, Logo, RadioGroupField } from '@/design-system';
import { useI18n } from '@/i18n';
import { ApiError, toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { cn } from '@/shared/lib/cn';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { participantApi } from '../api/cardSortingApi';
import { readableForeground, SocialIcon } from '../components/shared';
import { SOCIAL_NETWORKS, type Message, type ParticipantSession, type PostAnswer, type PublicSettings } from '../model/types';
import { RichTextView } from '../rich-text/RichTextView';
import { PostQuestionField } from './PostQuestionField';
import { initialGroups, SortBoard, type BoardGroup } from './SortBoard';

type Phase =
  | { name: 'welcome' }
  | { name: 'context' }
  | { name: 'screening' }
  | { name: 'instructions'; index: number }
  | { name: 'board' }
  | { name: 'post' }
  | { name: 'thanks' }
  | { name: 'rejected'; message: Message | null };

/**
 * Public participant flow (/cardsorting/{slug}/{code}):
 * bienvenida → contexto → validación → instrucciones → actividad → preguntas post-estudio → gracias.
 * Each screen has one primary action; focus moves to the new screen's heading.
 */
export function ParticipantPage() {
  const { t } = useI18n();
  const { code = '' } = useParams();
  const landing = useApiQuery((signal) => participantApi.landing(code, signal), [code]);

  if (landing.status === 'loading') return <LoadingState label={t('cardSorting.participant.loading')} fill />;

  if (landing.status === 'error') {
    const notFound = landing.error.kind === 'not_found';
    return (
      <Shell settings={null}>
        <Centered>
          <Screen
          title={notFound ? t('cardSorting.participant.notFoundTitle') : t('cardSorting.participant.errorTitle')}
            body={<p className="text-muted">{notFound ? t('cardSorting.participant.notFoundDescription') : toUserMessage(landing.error, t)}</p>}
          />
        </Centered>
      </Shell>
    );
  }

  const { status, welcome, closed, settings } = landing.data;

  if (status === 'closed' && closed) {
    return (
      <Shell settings={settings}>
        <Centered>
          <Screen title={closed.title} body={<RichTextView doc={closed.body} />} />
        </Centered>
      </Shell>
    );
  }
  if (status !== 'active' || !welcome) {
    return (
      <Shell settings={settings}>
        <Centered>
          <Screen title={t('cardSorting.participant.pausedTitle')} body={<p className="text-muted">{t('cardSorting.participant.pausedDescription')}</p>} />
        </Centered>
      </Shell>
    );
  }

  return (
    <Shell settings={settings}>
      <Flow code={code} welcome={welcome} settings={settings} />
    </Shell>
  );
}

function Flow({ code, welcome, settings }: { code: string; welcome: Message; settings: PublicSettings }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>({ name: 'welcome' });
  const [session, setSession] = useState<ParticipantSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screening, setScreening] = useState<Record<string, string>>({});
  const [screeningErrors, setScreeningErrors] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<BoardGroup[]>([]);
  const [answers, setAnswers] = useState<Record<string, PostAnswer>>({});
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
  usePageMeta({ title: welcome.title, noindex: true });

  const s = session;
  const flow = s?.flow;

  const afterContext = (current: ParticipantSession): Phase =>
    current.flow.screening.length ? { name: 'screening' } : current.flow.instructions.length ? { name: 'instructions', index: 0 } : { name: 'board' };

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const started = await participantApi.start(code);
      setSession(started);
      setGroups(initialGroups(started.sortType, started.categories));
      setPhase(started.flow.context ? { name: 'context' } : afterContext(started));
    } catch (err) {
      setError(toUserMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function submitScreening() {
    if (!s) return;
    const missing = Object.fromEntries(s.flow.screening.filter((q) => !screening[q.id]).map((q) => [q.id, t('cardSorting.participant.screeningRequired')]));
    setScreeningErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    setError(null);
    try {
      const result = await participantApi.screening(code, s.token, screening);
      if (result.result === 'screened_out') setPhase({ name: 'rejected', message: result.rejection });
      else setPhase(s.flow.instructions.length ? { name: 'instructions', index: 0 } : { name: 'board' });
    } catch (err) {
      setError(toUserMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!s) return;
    const missing = Object.fromEntries(s.flow.postStudy.filter((q) => q.required && answers[q.id] === undefined).map((q) => [q.id, t('cardSorting.participant.answerRequired')]));
    setAnswerErrors(missing);
    if (Object.keys(missing).length) return;
    setBusy(true);
    setError(null);
    try {
      await participantApi.complete(
        code,
        s.token,
        groups.filter((g) => g.cardIds.length).map((g) => (g.predefinedId ? { predefinedId: g.predefinedId, cardIds: g.cardIds } : { label: g.label.trim(), cardIds: g.cardIds })),
        answers,
      );
      setPhase({ name: 'thanks' });
    } catch (err) {
      setError(err instanceof ApiError && err.kind === 'validation' ? Object.values(err.fields)[0] ?? toUserMessage(err, t) : toUserMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  const errorAlert = error ? (
    <Alert tone="danger" title={t('cardSorting.participant.submitErrorTitle')}>
      {error}
    </Alert>
  ) : null;

  switch (phase.name) {
    case 'welcome':
      return (
        <Centered>
          <Screen title={welcome.title} body={<RichTextView doc={welcome.body} />} alert={errorAlert}>
            <Primary onPress={start} isLoading={busy} label={busy ? t('cardSorting.participant.starting') : settings.continueLabel} />
          </Screen>
        </Centered>
      );

    case 'context':
      return (
        <Centered>
          <Screen title={flow!.context!.title} body={<RichTextView doc={flow!.context!.body} />}>
            <Primary onPress={() => setPhase(afterContext(s!))} label={settings.continueLabel} />
          </Screen>
        </Centered>
      );

    case 'screening':
      return (
        <Centered>
        <Screen title={t('cardSorting.participant.screeningTitle')} alert={errorAlert}>
          <div className="grid gap-6">
            {flow!.screening.map((question) => (
              <RadioGroupField
                key={question.id}
                label={question.prompt}
                isRequired
                value={screening[question.id] ?? null}
                onChange={(value) => {
                  setScreeningErrors((e) => ({ ...e, [question.id]: '' }));
                  setScreening((a) => ({ ...a, [question.id]: value }));
                }}
                error={screeningErrors[question.id] || null}
                options={question.options.map((o) => ({ value: o.id, label: o.label }))}
              />
            ))}
          </div>
          <Primary onPress={submitScreening} isLoading={busy} label={settings.continueLabel} />
        </Screen>
        </Centered>
      );

    case 'instructions': {
      const steps = flow!.instructions;
      const step = steps[phase.index]!;
      const last = phase.index === steps.length - 1;
      return (
        <main id="main-content">
          <SortBoard
            sortType={s!.sortType}
            cards={s!.cards}
            groups={groups}
            onChange={setGroups}
            interactive={false}
            sidebarFooter={<MadeWith />}
            canvasContent={
              <Screen
                key={step.id}
                eyebrow={t('cardSorting.participant.instructionOf', { current: phase.index + 1, total: steps.length })}
                title={step.title}
                body={<RichTextView doc={step.body} />}
                className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-black/10 md:mt-0 md:p-8"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Primary onPress={() => setPhase(last ? { name: 'board' } : { name: 'instructions', index: phase.index + 1 })} label={settings.continueLabel} />
                  {!last && (
                    <Button variant="ghost" onPress={() => setPhase({ name: 'board' })}>
                      {t('cardSorting.participant.skip')}
                    </Button>
                  )}
                </div>
              </Screen>
            }
          />
        </main>
      );
    }

    case 'board': {
      const sortedIds = new Set(groups.flatMap((g) => g.cardIds));
      const remaining = s!.cards.filter((c) => !sortedIds.has(c.id)).length;
      const unnamed = groups.filter((g) => !g.predefinedId && g.cardIds.length && !g.label.trim()).length;
      const hasPost = flow!.postStudy.length > 0;
      return (
        <main id="main-content">
          <h1 id="participant-heading" className="sr-only">
            {t('cardSorting.participant.board.title')}
          </h1>
          <SortBoard
            sortType={s!.sortType}
            cards={s!.cards}
            groups={groups}
            onChange={setGroups}
            interactive
            sidebarFooter={<MadeWith />}
            header={
              <div className="grid max-w-[min(28rem,calc(100vw-1.5rem))] gap-2 rounded-2xl border border-border bg-overlay/95 p-2 ps-4 shadow-lg shadow-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <p aria-live="polite" className="text-sm text-muted">
                    {remaining > 0
                      ? t('cardSorting.participant.board.unsortedCount', { count: remaining })
                      : unnamed > 0
                        ? t('cardSorting.participant.board.unnamedGroups', { count: unnamed })
                        : t('cardSorting.participant.board.allSorted')}
                  </p>
                  <Primary
                    isDisabled={remaining > 0 || unnamed > 0}
                    isLoading={busy && !hasPost}
                    onPress={hasPost ? () => setPhase({ name: 'post' }) : finish}
                    label={hasPost ? settings.continueLabel : settings.finishLabel}
                    size="md"
                  />
                </div>
                {errorAlert}
              </div>
            }
          />
        </main>
      );
    }

    case 'post':
      return (
        <Centered>
        <Screen title={t('cardSorting.participant.postTitle')} alert={errorAlert}>
          <div className="grid gap-8">
            {flow!.postStudy.map((question) => (
              <PostQuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                error={answerErrors[question.id]}
                onChange={(value) => {
                  setAnswerErrors((e) => ({ ...e, [question.id]: '' }));
                  setAnswers((current) => {
                    const next = { ...current };
                    if (value === undefined) delete next[question.id];
                    else next[question.id] = value;
                    return next;
                  });
                }}
              />
            ))}
          </div>
          <Primary onPress={finish} isLoading={busy} label={settings.finishLabel} />
        </Screen>
        </Centered>
      );

    case 'thanks':
      return (
        <Centered>
          <Screen title={flow!.thanks.title} body={<RichTextView doc={flow!.thanks.body} />} footer={<SocialLinks settings={settings} />} />
        </Centered>
      );

    case 'rejected':
      return (
        <Centered>
          <Screen title={phase.message?.title ?? ''} body={<RichTextView doc={phase.message?.body} />} />
        </Centered>
      );
  }
}

/**
 * Applies the study's accent colour through theme variables. Hover darkens a light accent or lightens a dark one
 * (mixing black or white), so the designer's colour is kept instead of falling back to Soraq's.
 */
function Shell({ settings, children }: { settings: PublicSettings | null; children: ReactNode }) {
  const accent = settings?.accentColor;
  const foreground = accent ? readableForeground(accent) : null;
  const style = accent
    ? ({
        '--accent': accent,
        '--accent-foreground': foreground,
        '--accent-hover': `color-mix(in oklab, ${accent} 86%, ${foreground === '#ffffff' ? '#ffffff' : '#000000'} 14%)`,
        '--focus': accent,
      } as CSSProperties)
    : undefined;

  return (
    <div style={style} className="min-h-dvh bg-background">
      {children}
    </div>
  );
}

/** Message screens (welcome, questions, thanks…): centered column with the Soraq credit below. */
function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main-content" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 md:px-8 md:py-16">
        {children}
      </main>
      <footer className="flex justify-center px-4 pb-6">
        <MadeWith />
      </footer>
    </div>
  );
}

function MadeWith() {
  const { t } = useI18n();
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg text-xs text-muted no-underline transition-colors hover:text-foreground"
    >
      <Logo variant="mark" size="sm" />
      {t('cardSorting.participant.madeWith')}
    </a>
  );
}

function Screen({
  eyebrow,
  title,
  body,
  alert,
  children,
  footer,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  alert?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <section aria-labelledby="participant-heading" className={cn('mx-auto grid w-full max-w-2xl gap-6 transition-[opacity,translate] duration-300 starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none md:mt-[8dvh]', className)}>
      <header className="grid gap-2">
        {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
        <h1 id="participant-heading" ref={headingRef} tabIndex={-1} className="text-3xl font-semibold tracking-tight outline-none md:text-4xl">
          {title}
        </h1>
      </header>
      {body && <div className="text-base leading-relaxed">{body}</div>}
      {alert}
      {children}
      {footer}
    </section>
  );
}

function Primary({ label, onPress, isLoading, isDisabled, size = 'lg' }: { label: string; onPress: () => void; isLoading?: boolean; isDisabled?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div className="shrink-0">
      <Button variant="primary" size={size} onPress={onPress} isLoading={isLoading} isDisabled={isDisabled}>
        {label}
      </Button>
    </div>
  );
}

function SocialLinks({ settings }: { settings: PublicSettings }) {
  const { t } = useI18n();
  const links = SOCIAL_NETWORKS.filter((network) => settings.socialLinks[network]);
  if (!links.length) return null;

  return (
    <ul aria-label={t('cardSorting.social.listLabel')} className="flex list-none flex-wrap gap-2 p-0">
      {links.map((network) => (
        <li key={network}>
          <a
            href={settings.socialLinks[network]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('cardSorting.social.linkLabel', { network: t(`cardSorting.social.${network}`) })}
            className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <SocialIcon network={network} />
          </a>
        </li>
      ))}
    </ul>
  );
}
