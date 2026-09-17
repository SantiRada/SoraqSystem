import { useState } from 'react';
import { ArrowLeft, ArrowRight, CircleAlert, Send } from 'lucide-react';
import { Button, Card, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { LIMITS, type StudyDocument } from '../../model/types';
import type { FieldErrors } from '../../pages/StudyPage';
import { RichTextEditor } from '../../rich-text/RichTextEditor';
import { CardsStep } from './CardsStep';
import { CategoriesStep } from './CategoriesStep';
import { FlowStep } from './FlowStep';

export interface StepProps {
  document: StudyDocument;
  update: (recipe: (draft: StudyDocument) => StudyDocument) => void;
  errors: FieldErrors;
  readOnly: boolean;
}

const STEPS = [
  { id: 'general', prefixes: ['name', 'purpose', 'participantRequirements'] },
  { id: 'cards', prefixes: ['cards', 'cardsHaveDescriptions', 'randomizeCards'] },
  { id: 'categories', prefixes: ['sortType', 'categories', 'randomizeCategories'] },
  { id: 'flow', prefixes: ['flow'] },
] as const;
export type StepId = (typeof STEPS)[number]['id'];

/**
 * Contenido: the study configured as a short sequence of steps (one topic per screen) so the procedure
 * is clear and no screen has too many inputs. Steps can be visited in any order.
 */
export function ContentTab({ isDraft, onPublish, ...props }: StepProps & { isDraft: boolean; onPublish: () => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState<StepId>('general');
  const index = STEPS.findIndex((s) => s.id === current);
  const hasErrors = (prefixes: readonly string[]) => Object.keys(props.errors).some((key) => prefixes.some((p) => key === p || key.startsWith(`${p}.`)));
  const isLast = index === STEPS.length - 1;

  const go = (id: StepId) => {
    setCurrent(id);
    setTimeout(() => {
      const heading = document.getElementById('content-step-heading');
      heading?.focus();
      heading?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label={t('cardSorting.steps.label')} className="overflow-x-auto lg:overflow-visible">
        <ol className="flex w-max list-none gap-1 p-0 lg:sticky lg:top-6 lg:w-auto lg:flex-col">
          {STEPS.map((step, i) => {
            const active = step.id === current;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  aria-current={active ? 'step' : undefined}
                  onClick={() => go(step.id)}
                  className={cn(
                    'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-default-soft hover:text-foreground',
                    active && 'bg-default font-medium text-foreground',
                  )}
                >
                  <span aria-hidden="true" className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-xs transition-colors', active ? 'border-accent bg-accent text-accent-foreground' : 'border-border')}>
                    {i + 1}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{t(`cardSorting.steps.${step.id}`)}</span>
                  {hasErrors(step.prefixes) && <CircleAlert aria-label={t('cardSorting.save.errorTitle')} className="ms-auto size-4 shrink-0 text-danger" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid min-w-0 gap-6">
        <header>
          <p className="text-xs text-muted">{t('cardSorting.steps.stepOf', { current: index + 1, total: STEPS.length })}</p>
          <h2 id="content-step-heading" tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
            {t(`cardSorting.steps.${current}`)}
          </h2>
        </header>

        <div key={current} data-animate-enter className="grid gap-6">
          {current === 'general' && <GeneralStep {...props} />}
          {current === 'cards' && <CardsStep {...props} />}
          {current === 'categories' && <CategoriesStep {...props} />}
          {current === 'flow' && <FlowStep {...props} onGoToStep={go} />}
        </div>

        <div className={cn('flex flex-wrap items-center gap-2', index === 0 ? 'justify-end' : 'justify-between')}>
          {index > 0 && (
            <Button variant="ghost" leadingIcon={<ArrowLeft />} onPress={() => go(STEPS[index - 1]!.id)}>
              {t('cardSorting.steps.previous')}
            </Button>
          )}
          {!isLast && (
            <Button variant={isDraft ? 'contrast' : 'secondary'} trailingIcon={<ArrowRight />} onPress={() => go(STEPS[index + 1]!.id)}>
              {t('cardSorting.steps.next', { step: t(`cardSorting.steps.${STEPS[index + 1]!.id}`) })}
            </Button>
          )}
          {isLast && isDraft && !props.readOnly && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <p className="text-sm text-muted">{t('cardSorting.flow.publishHint')}</p>
              <Button variant="primary" leadingIcon={<Send />} onPress={onPublish}>
                {t('cardSorting.study.publish')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralStep({ document, update, errors, readOnly }: StepProps) {
  const { t } = useI18n();
  return (
    <Card className="grid gap-6 rounded-3xl border border-border bg-surface p-5 md:p-6">
      <TextField
        label={t('cardSorting.general.nameLabel')}
        name="name"
        isRequired
        isDisabled={readOnly}
        maxLength={LIMITS.name}
        value={document.name}
        onChange={(name) => update((d) => ({ ...d, name }))}
        error={errors.name}
      />
      <RichTextEditor
        label={t('cardSorting.general.purposeLabel')}
        hint={t('cardSorting.general.purposeHint')}
        value={document.purpose}
        onChange={(purpose) => update((d) => ({ ...d, purpose }))}
        error={errors.purpose}
        isDisabled={readOnly}
      />
      <RichTextEditor
        label={t('cardSorting.participants.requirementsLabel')}
        hint={t('cardSorting.participants.requirementsHint')}
        value={document.participantRequirements}
        onChange={(participantRequirements) => update((d) => ({ ...d, participantRequirements }))}
        error={errors.participantRequirements}
        isDisabled={readOnly}
      />
    </Card>
  );
}
