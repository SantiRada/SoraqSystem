import { useState, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, CheckboxField, IconButton, SelectField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { LIMITS, type PostQuestion, type QuestionType, type ScreeningQuestion } from '../model/types';
import { newId } from '../components/shared';
import { Collapsible } from '../components/Collapsible';
import { replaceAt } from '../components/listHelpers';
import { SortableList } from '../components/SortableList';

interface EditorProps<Q> {
  questions: Q[];
  onChange: (questions: Q[]) => void;
  errors: Record<string, string>;
  readOnly: boolean;
}

/** Open/closed state of collapsible questions. Creating a question collapses the rest and opens the new one. */
function useQuestionPanels(errors: Record<string, string>, path: string, questions: { id: string }[]) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(questions.filter((_, i) => Object.keys(errors).some((k) => k.startsWith(`${path}.${i}.`))).map((q) => q.id)));
  return {
    isOpen: (id: string) => open.has(id),
    toggle: (id: string) =>
      setOpen((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    openOnly: (id: string) => setOpen(new Set([id])),
  };
}

interface QuestionShellProps {
  number: number;
  prompt: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  handle: ReactNode;
  onRemove: () => void;
  readOnly: boolean;
  hasError: boolean;
  children: ReactNode;
}

function QuestionShell({ number, prompt, badge, isOpen, onToggle, handle, onRemove, readOnly, hasError, children }: QuestionShellProps) {
  const { t } = useI18n();
  return (
    <div className={cn('rounded-2xl border p-2 md:p-3', hasError ? 'border-danger' : 'border-border')}>
      <Collapsible
        isOpen={isOpen}
        onToggle={onToggle}
        leading={handle}
        header={
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{t('studies.flow.question', { number })}</span>
            {badge && <Badge>{badge}</Badge>}
            <span className="min-w-0 truncate text-sm text-muted">{prompt || t('studies.flow.untitledQuestion')}</span>
          </span>
        }
        trailing={!readOnly ? <IconButton size="sm" label={t('studies.flow.removeQuestion', { number })} icon={<Trash2 />} onPress={onRemove} /> : undefined}
        contentClassName="grid gap-4 px-1 pb-1 pt-3"
      >
        {children}
      </Collapsible>
    </div>
  );
}

/** Screening questions: single choice; each option either lets the participant continue or ends the participation. */
export function ScreeningEditor({ questions, onChange, errors, readOnly }: EditorProps<ScreeningQuestion>) {
  const { t } = useI18n();
  const path = 'flow.screening.questions';
  const panels = useQuestionPanels(errors, path, questions);

  return (
    <div className="grid gap-3">
      {errors['flow.screening'] && <p className="text-sm text-danger">{errors['flow.screening']}</p>}
      <SortableList
        items={questions}
        onReorder={onChange}
        isDisabled={readOnly}
        handleLabel={(_, i) => t('studies.flow.reorderQuestion', { number: i + 1 })}
        movedMessage={(q, position) => t('cardSorting.cards.moved', { label: q.prompt || t('studies.flow.untitledQuestion'), position })}
        renderItem={(question, qi, handle) => (
          <QuestionShell
            number={qi + 1}
            prompt={question.prompt}
            isOpen={panels.isOpen(question.id)}
            onToggle={() => panels.toggle(question.id)}
            handle={handle}
            readOnly={readOnly}
            hasError={Object.keys(errors).some((k) => k.startsWith(`${path}.${qi}.`))}
            onRemove={() => onChange(questions.filter((q) => q.id !== question.id))}
          >
            <TextField
              label={t('studies.flow.questionPrompt')}
              name={`screening-${question.id}`}
              isRequired
              isDisabled={readOnly}
              maxLength={LIMITS.title}
              value={question.prompt}
              onChange={(prompt) => onChange(replaceAt(questions, qi, { ...question, prompt }))}
              error={errors[`${path}.${qi}.prompt`]}
            />
            <div className="grid gap-2">
              <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 text-sm font-medium sm:grid-cols-[minmax(0,1fr)_14rem_2.25rem]">
                <span>{t('studies.flow.options')}</span>
                <span className="hidden sm:block">{t('studies.flow.outcome')}</span>
              </div>
              <ol className="grid list-none gap-2 p-0">
                {question.options.map((option, oi) => (
                  <li key={option.id} className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_2.25rem]">
                    <TextField
                      hideLabel
                      label={t('studies.flow.optionLabel', { number: oi + 1 })}
                      name={`screening-option-${option.id}`}
                      isRequired
                      isDisabled={readOnly}
                      maxLength={LIMITS.label}
                      value={option.label}
                      onChange={(label) => onChange(replaceAt(questions, qi, { ...question, options: replaceAt(question.options, oi, { ...option, label }) }))}
                      error={errors[`${path}.${qi}.options.${oi}.label`]}
                    />
                    <SelectField
                      hideLabel
                      label={t('studies.flow.optionOutcome', { number: oi + 1 })}
                      isDisabled={readOnly}
                      value={option.qualifies ? 'continue' : 'end'}
                      onChange={(v) => onChange(replaceAt(questions, qi, { ...question, options: replaceAt(question.options, oi, { ...option, qualifies: v === 'continue' }) }))}
                      options={[
                        { id: 'continue', label: t('studies.flow.qualifies') },
                        { id: 'end', label: t('studies.flow.disqualifies') },
                      ]}
                    />
                    {!readOnly && (
                      <IconButton
                        size="sm"
                        label={t('studies.flow.removeOption', { number: oi + 1 })}
                        icon={<Trash2 />}
                        onPress={() => onChange(replaceAt(questions, qi, { ...question, options: question.options.filter((o) => o.id !== option.id) }))}
                      />
                    )}
                  </li>
                ))}
              </ol>
              {errors[`${path}.${qi}.options`] && <p className="text-sm text-danger">{errors[`${path}.${qi}.options`]}</p>}
              {!readOnly && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<Plus />}
                    isDisabled={question.options.length >= LIMITS.options}
                    onPress={() => onChange(replaceAt(questions, qi, { ...question, options: [...question.options, { id: newId(), label: '', qualifies: true }] }))}
                  >
                    {t('studies.flow.addOption')}
                  </Button>
                </div>
              )}
            </div>
          </QuestionShell>
        )}
      />
      {!readOnly && (
        <div>
          <Button
            variant="secondary"
            leadingIcon={<Plus />}
            isDisabled={questions.length >= LIMITS.questions}
            onPress={() => {
              const id = newId();
              onChange([
                ...questions,
                {
                  id,
                  prompt: '',
                  options: [
                    { id: newId(), label: '', qualifies: true },
                    { id: newId(), label: '', qualifies: false },
                  ],
                },
              ]);
              panels.openOnly(id);
            }}
          >
            {t('studies.flow.addQuestion')}
          </Button>
        </div>
      )}
    </div>
  );
}

const TYPES: QuestionType[] = ['stars', 'scale', 'text', 'radio', 'checkbox'];

/** Post-study questions: stars, numeric scale, text (with placeholder), single or multiple choice; optional or required. */
export function PostStudyEditor({ questions, onChange, errors, readOnly }: EditorProps<PostQuestion>) {
  const { t } = useI18n();
  const path = 'flow.postStudy.questions';
  const panels = useQuestionPanels(errors, path, questions);

  const setType = (question: PostQuestion, type: QuestionType): PostQuestion => ({
    ...question,
    type,
    scaleMax: type === 'stars' || type === 'scale' ? (question.scaleMax ?? 5) : null,
    placeholder: type === 'text' ? (question.placeholder ?? null) : null,
    options:
      type === 'radio' || type === 'checkbox'
        ? question.options.length
          ? question.options
          : [
              { id: newId(), label: '' },
              { id: newId(), label: '' },
            ]
        : [],
  });

  return (
    <div className="grid gap-3">
      <SortableList
        items={questions}
        onReorder={onChange}
        isDisabled={readOnly}
        handleLabel={(_, i) => t('studies.flow.reorderQuestion', { number: i + 1 })}
        movedMessage={(q, position) => t('cardSorting.cards.moved', { label: q.prompt || t('studies.flow.untitledQuestion'), position })}
        renderItem={(question, qi, handle) => {
          const hasOptions = question.type === 'radio' || question.type === 'checkbox';
          const hasScale = question.type === 'stars' || question.type === 'scale';
          const min = question.type === 'stars' ? 3 : 2;
          return (
            <QuestionShell
              number={qi + 1}
              prompt={question.prompt}
              badge={t(`studies.flow.questionTypes.${question.type}`)}
              isOpen={panels.isOpen(question.id)}
              onToggle={() => panels.toggle(question.id)}
              handle={handle}
              readOnly={readOnly}
              hasError={Object.keys(errors).some((k) => k.startsWith(`${path}.${qi}.`))}
              onRemove={() => onChange(questions.filter((q) => q.id !== question.id))}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <TextField
                  label={t('studies.flow.questionPrompt')}
                  name={`post-${question.id}`}
                  isRequired
                  isDisabled={readOnly}
                  maxLength={LIMITS.title}
                  value={question.prompt}
                  onChange={(prompt) => onChange(replaceAt(questions, qi, { ...question, prompt }))}
                  error={errors[`${path}.${qi}.prompt`]}
                />
                <SelectField
                  label={t('studies.flow.questionType')}
                  isDisabled={readOnly}
                  value={question.type}
                  onChange={(v) => onChange(replaceAt(questions, qi, setType(question, v as QuestionType)))}
                  options={TYPES.map((type) => ({ id: type, label: t(`studies.flow.questionTypes.${type}`) }))}
                />
              </div>

              {question.type === 'text' && (
                <TextField
                  label={t('studies.flow.placeholderLabel')}
                  hint={t('studies.flow.placeholderHint')}
                  name={`post-placeholder-${question.id}`}
                  isDisabled={readOnly}
                  maxLength={LIMITS.placeholder}
                  value={question.placeholder ?? ''}
                  onChange={(placeholder) => onChange(replaceAt(questions, qi, { ...question, placeholder: placeholder || null }))}
                  error={errors[`${path}.${qi}.placeholder`]}
                />
              )}

              {hasScale && (
                <SelectField
                  className="max-w-40"
                  label={t('studies.flow.scaleMax')}
                  isDisabled={readOnly}
                  value={String(question.scaleMax ?? 5)}
                  onChange={(v) => onChange(replaceAt(questions, qi, { ...question, scaleMax: Number(v) }))}
                  options={Array.from({ length: 10 - min + 1 }, (_, i) => String(i + min)).map((v) => ({ id: v, label: v }))}
                  error={errors[`${path}.${qi}.scaleMax`]}
                />
              )}

              {hasOptions && (
                <div className="grid gap-2">
                  <span aria-hidden="true" className="text-sm font-medium">
                    {t('studies.flow.options')}
                  </span>
                  <ol className="grid list-none gap-2 p-0">
                    {question.options.map((option, oi) => (
                      <li key={option.id} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <TextField
                            hideLabel
                            label={t('studies.flow.optionLabel', { number: oi + 1 })}
                            name={`post-option-${option.id}`}
                            isRequired
                            isDisabled={readOnly}
                            maxLength={LIMITS.label}
                            value={option.label}
                            onChange={(label) => onChange(replaceAt(questions, qi, { ...question, options: replaceAt(question.options, oi, { ...option, label }) }))}
                            error={errors[`${path}.${qi}.options.${oi}.label`]}
                          />
                        </div>
                        {!readOnly && (
                          <IconButton
                            size="sm"
                            label={t('studies.flow.removeOption', { number: oi + 1 })}
                            icon={<Trash2 />}
                            onPress={() => onChange(replaceAt(questions, qi, { ...question, options: question.options.filter((o) => o.id !== option.id) }))}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                  {errors[`${path}.${qi}.options`] && <p className="text-sm text-danger">{errors[`${path}.${qi}.options`]}</p>}
                  {!readOnly && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<Plus />}
                        isDisabled={question.options.length >= LIMITS.options}
                        onPress={() => onChange(replaceAt(questions, qi, { ...question, options: [...question.options, { id: newId(), label: '' }] }))}
                      >
                        {t('studies.flow.addOption')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <CheckboxField
                label={t('studies.flow.required')}
                isSelected={question.required}
                isDisabled={readOnly}
                onChange={(required) => onChange(replaceAt(questions, qi, { ...question, required }))}
              />
            </QuestionShell>
          );
        }}
      />
      {!readOnly && (
        <div>
          <Button
            variant="secondary"
            leadingIcon={<Plus />}
            isDisabled={questions.length >= LIMITS.questions}
            onPress={() => {
              const id = newId();
              onChange([...questions, { id, type: 'stars', prompt: '', required: false, options: [], scaleMax: 5, placeholder: null }]);
              panels.openOnly(id);
            }}
          >
            {t('studies.flow.addQuestion')}
          </Button>
        </div>
      )}
    </div>
  );
}
