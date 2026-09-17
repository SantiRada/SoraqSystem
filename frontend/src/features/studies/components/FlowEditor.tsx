import { useState, type ReactNode } from 'react';
import { ChevronsDownUp, ChevronsUpDown, Layers, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, IconButton, Reveal, SwitchField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { LIMITS, type Flow, type Message } from '../model/types';
import { RichTextEditor } from '../rich-text/RichTextEditor';
import { newId } from '../components/shared';
import { Collapsible } from '../components/Collapsible';
import type { StepId, StepProps } from './ContentTab';
import { replaceAt } from '../components/listHelpers';
import { PostStudyEditor, ScreeningEditor } from '../components/QuestionEditors';
import { SortableList } from '../components/SortableList';

const SECTIONS = ['welcome', 'context', 'screening', 'instructions', 'activity', 'postStudy', 'thanks', 'closed'] as const;
type SectionId = (typeof SECTIONS)[number];

/** Flujo: everything participants see, in order. Each part collapses so the designer can focus on one. */
export function FlowStep({ document, update, errors, readOnly, onGoToStep }: StepProps & { onGoToStep: (step: StepId) => void }) {
  const { t } = useI18n();
  const { flow } = document;
  const setFlow = (recipe: (flow: Flow) => Flow) => update((d) => ({ ...d, flow: recipe(d.flow) }));

  // Sections with errors open automatically so the problem is visible.
  const withErrors = SECTIONS.filter((id) => Object.keys(errors).some((key) => key.startsWith(`flow.${id === 'activity' ? '__' : id}`)));
  const [open, setOpen] = useState<Set<SectionId>>(() => new Set<SectionId>(['welcome', ...withErrors]));
  const allOpen = open.size === SECTIONS.length;
  // Instruction steps collapse too; adding a step opens only the new one.
  const [openSteps, setOpenSteps] = useState<Set<string>>(() => new Set(flow.instructions.filter((_, i) => Object.keys(errors).some((k) => k.startsWith(`flow.instructions.${i}.`))).map((step) => step.id)));
  const toggleStep = (id: string) =>
    setOpenSteps((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggle = (id: SectionId) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const section = (id: SectionId, number: number, title: string, body: ReactNode, extra?: { optional?: boolean; enabled?: boolean; description?: string; muted?: boolean }) => (
    <li key={id}>
      <Card className={cn('rounded-3xl border border-border p-3 md:p-4', extra?.muted ? 'bg-surface-secondary/50' : 'bg-surface')}>
        <Collapsible
          isOpen={open.has(id)}
          onToggle={() => toggle(id)}
          header={
            <span className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-default text-xs font-semibold">
                {number}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-base font-semibold">
                  {title}
                  {extra?.optional && <Badge tone={extra.enabled ? 'accent' : 'neutral'}>{extra.enabled ? t('studies.flow.enabled') : t('studies.flow.optional')}</Badge>}
                </span>
                {extra?.description && <span className="text-sm text-muted">{extra.description}</span>}
              </span>
            </span>
          }
          contentClassName="grid gap-4 px-1 pb-2 pt-4 md:ps-11"
        >
          {body}
        </Collapsible>
      </Card>
    </li>
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted">{t('studies.flow.description')}</p>
        <IconButton
          label={allOpen ? t('studies.flow.collapseAll') : t('studies.flow.expandAll')}
          icon={allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
          variant="secondary"
          onPress={() => setOpen(allOpen ? new Set() : new Set(SECTIONS))}
        />
      </div>

      <ol className="grid list-none gap-3 p-0">
        {section('welcome', 1, t('studies.flow.welcome'), <MessageFields path="flow.welcome" value={flow.welcome} onChange={(welcome) => setFlow((f) => ({ ...f, welcome }))} errors={errors} readOnly={readOnly} />)}

        {section(
          'context',
          2,
          t('studies.flow.context'),
          <>
            <SwitchField label={t('studies.flow.contextToggle')} isSelected={flow.context.enabled} onChange={(enabled) => setFlow((f) => ({ ...f, context: { ...f.context, enabled } }))} isDisabled={readOnly} />
            <Reveal isOpen={flow.context.enabled} lazy>
              <MessageFields path="flow.context" value={flow.context} onChange={(context) => setFlow((f) => ({ ...f, context: { ...f.context, ...context } }))} errors={errors} readOnly={readOnly} />
            </Reveal>
          </>,
          { optional: true, enabled: flow.context.enabled },
        )}

        {section(
          'screening',
          3,
          t('studies.flow.screening'),
          <>
            <SwitchField
              label={t('studies.flow.screeningToggle')}
              description={t('studies.flow.screeningHint')}
              isSelected={flow.screening.enabled}
              onChange={(enabled) => setFlow((f) => ({ ...f, screening: { ...f.screening, enabled } }))}
              isDisabled={readOnly}
            />
            <Reveal isOpen={flow.screening.enabled} lazy>
              <div className="grid gap-4">
                <ScreeningEditor questions={flow.screening.questions} onChange={(questions) => setFlow((f) => ({ ...f, screening: { ...f.screening, questions } }))} errors={errors} readOnly={readOnly} />
                <div className="grid gap-3 rounded-2xl border border-border p-4">
                  <div>
                    <h4 className="text-sm font-semibold">{t('studies.flow.rejection')}</h4>
                    <p className="text-sm text-muted">{t('studies.flow.rejectionHint')}</p>
                  </div>
                  <MessageFields
                    path="flow.screening.rejection"
                    value={flow.screening.rejection}
                    onChange={(rejection) => setFlow((f) => ({ ...f, screening: { ...f.screening, rejection } }))}
                    errors={errors}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </Reveal>
          </>,
          { optional: true, enabled: flow.screening.enabled },
        )}

        {section(
          'instructions',
          4,
          t('studies.flow.instructions'),
          <>
            <SortableList
              items={flow.instructions}
              onReorder={(instructions) => setFlow((f) => ({ ...f, instructions }))}
              isDisabled={readOnly}
              className="gap-3"
              handleLabel={(_, i) => t('studies.flow.reorderStep', { number: i + 1 })}
              movedMessage={(step, position) => t('cardSorting.cards.moved', { label: step.title || t('studies.flow.step', { number: position }), position })}
              renderItem={(step, i, handle) => (
                <div className={cn('rounded-2xl border p-2 md:p-3', Object.keys(errors).some((k) => k.startsWith(`flow.instructions.${i}.`)) ? 'border-danger' : 'border-border')}>
                  <Collapsible
                    isOpen={openSteps.has(step.id)}
                    onToggle={() => toggleStep(step.id)}
                    leading={handle}
                    header={
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-sm font-semibold">{t('studies.flow.step', { number: i + 1 })}</span>
                        <span className="min-w-0 truncate text-sm text-muted">{step.title}</span>
                      </span>
                    }
                    trailing={
                      !readOnly ? (
                        <IconButton
                          size="sm"
                          label={t('studies.flow.removeStep', { number: i + 1 })}
                          icon={<Trash2 />}
                          onPress={() => setFlow((f) => ({ ...f, instructions: f.instructions.filter((s) => s.id !== step.id) }))}
                        />
                      ) : undefined
                    }
                    contentClassName="grid gap-3 px-1 pb-1 pt-3"
                  >
                    <MessageFields
                      path={`flow.instructions.${i}`}
                      value={step}
                      onChange={(message) => setFlow((f) => ({ ...f, instructions: replaceAt(f.instructions, i, { ...step, ...message }) }))}
                      errors={errors}
                      readOnly={readOnly}
                    />
                  </Collapsible>
                </div>
              )}
            />
            {!readOnly && (
              <div>
                <Button
                  variant="secondary"
                  leadingIcon={<Plus />}
                  isDisabled={flow.instructions.length >= LIMITS.steps}
                  onPress={() => {
                    const id = newId();
                    setFlow((f) => ({ ...f, instructions: [...f.instructions, { id, title: '', body: { type: 'doc', content: [] } }] }));
                    setOpenSteps(new Set([id]));
                  }}
                >
                  {t('studies.flow.addStep')}
                </Button>
              </div>
            )}
          </>,
          { description: t('studies.flow.instructionsHint') },
        )}

        {section(
          'activity',
          5,
          t('cardSorting.flow.activity'),
          <>
            <p className="flex items-center gap-2 text-sm text-muted">
              <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
              {t('cardSorting.flow.activityHint')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leadingIcon={<LayoutGrid />} onPress={() => onGoToStep('cards')}>
                {t('cardSorting.flow.goToCards')}
              </Button>
              <Button variant="secondary" size="sm" leadingIcon={<Layers />} onPress={() => onGoToStep('categories')}>
                {t('cardSorting.flow.goToCategories')}
              </Button>
            </div>
          </>,
          { muted: true },
        )}

        {section(
          'postStudy',
          6,
          t('studies.flow.postStudy'),
          <>
            <SwitchField
              label={t('studies.flow.postStudyToggle')}
              isSelected={flow.postStudy.enabled}
              onChange={(enabled) => setFlow((f) => ({ ...f, postStudy: { ...f.postStudy, enabled } }))}
              isDisabled={readOnly}
            />
            <Reveal isOpen={flow.postStudy.enabled} lazy>
              <PostStudyEditor questions={flow.postStudy.questions} onChange={(questions) => setFlow((f) => ({ ...f, postStudy: { ...f.postStudy, questions } }))} errors={errors} readOnly={readOnly} />
            </Reveal>
            {errors['flow.postStudy'] && <p className="text-sm text-danger">{errors['flow.postStudy']}</p>}
          </>,
          { optional: true, enabled: flow.postStudy.enabled },
        )}

        {section('thanks', 7, t('studies.flow.thanks'), <MessageFields path="flow.thanks" value={flow.thanks} onChange={(thanks) => setFlow((f) => ({ ...f, thanks }))} errors={errors} readOnly={readOnly} />, {
          description: t('studies.flow.thanksHint'),
        })}

        {section('closed', 8, t('studies.flow.closed'), <MessageFields path="flow.closed" value={flow.closed} onChange={(closed) => setFlow((f) => ({ ...f, closed }))} errors={errors} readOnly={readOnly} />, {
          description: t('studies.flow.closedHint'),
        })}
      </ol>
    </div>
  );
}

function MessageFields({ path, value, onChange, errors, readOnly }: { path: string; value: Message; onChange: (message: Message) => void; errors: Record<string, string>; readOnly: boolean }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4">
      <TextField
        label={t('studies.flow.titleLabel')}
        name={`${path}.title`}
        isRequired
        isDisabled={readOnly}
        maxLength={LIMITS.title}
        value={value.title}
        onChange={(title) => onChange({ title, body: value.body })}
        error={errors[`${path}.title`]}
      />
      <RichTextEditor
        label={t('studies.flow.bodyLabel')}
        value={value.body}
        onChange={(body) => onChange({ title: value.title, body })}
        error={errors[`${path}.body`]}
        isDisabled={readOnly}
        size="tall"
      />
    </div>
  );
}
