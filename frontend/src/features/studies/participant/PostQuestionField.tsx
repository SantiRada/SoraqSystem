import { Star } from 'lucide-react';
import { CheckboxGroupField, RadioGroupField, TextAreaField } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { LIMITS, type PostAnswer, type PostQuestion } from '../model/types';

interface PostQuestionFieldProps {
  question: PostQuestion;
  value: PostAnswer | undefined;
  onChange: (value: PostAnswer | undefined) => void;
  error?: string | null;
}

/** One post-study question, rendered according to its type. */
export function PostQuestionField({ question, value, onChange, error }: PostQuestionFieldProps) {
  const { t } = useI18n();
  const label = `${question.prompt} ${question.required ? t('studies.participant.requiredMark') : t('studies.participant.optionalMark')}`;

  switch (question.type) {
    case 'stars':
      return <StarsField label={label} max={question.scaleMax ?? 5} value={typeof value === 'number' ? value : null} onChange={onChange} error={error} name={question.id} />;
    case 'scale':
      return (
        <RadioGroupField
          label={label}
          orientation="horizontal"
          value={typeof value === 'number' ? String(value) : null}
          onChange={(v) => onChange(Number(v))}
          error={error}
          isRequired={question.required}
          options={Array.from({ length: question.scaleMax ?? 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        />
      );
    case 'text':
      return (
        <TextAreaField
          label={label}
          name={question.id}
          isRequired={question.required}
          maxLength={LIMITS.textAnswer}
          rows={4}
          placeholder={question.placeholder ?? undefined}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v === '' ? undefined : v)}
          error={error}
        />
      );
    case 'radio':
      return (
        <RadioGroupField
          label={label}
          value={typeof value === 'string' ? value : null}
          onChange={onChange}
          error={error}
          isRequired={question.required}
          options={question.options.map((o) => ({ value: o.id, label: o.label }))}
        />
      );
    case 'checkbox':
      return (
        <CheckboxGroupField
          label={label}
          value={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(v.length ? v : undefined)}
          error={error}
          isRequired={question.required}
          options={question.options.map((o) => ({ value: o.id, label: o.label }))}
        />
      );
  }
}

/** Star rating as native radio inputs (arrow keys, screen readers) with star visuals. */
function StarsField({ label, max, value, onChange, error, name }: { label: string; max: number; value: number | null; onChange: (v: number) => void; error?: string | null; name: string }) {
  const { t } = useI18n();
  const errorId = `${name}-error`;

  return (
    <fieldset className="grid gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <label key={n} className="relative grid size-11 cursor-pointer place-items-center rounded-xl hover:bg-default-soft">
            <input
              type="radio"
              name={`stars-${name}`}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="sr-only">{t('studies.participant.stars', { count: n })}</span>
            <Star
              aria-hidden="true"
              className={cn('size-7 rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus', value !== null && n <= value ? 'fill-accent text-accent' : 'text-muted')}
            />
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
