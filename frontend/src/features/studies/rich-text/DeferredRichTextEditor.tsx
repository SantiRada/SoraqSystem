import { useState } from 'react';
import { useI18n } from '@/i18n';
import type { RichDoc } from '../model/types';
import { RichTextEditor } from './RichTextEditor';
import { isRichTextEmpty, RichTextView } from './RichTextView';

interface DeferredRichTextEditorProps {
  label: string;
  value: RichDoc | null;
  onChange: (doc: RichDoc) => void;
  error?: string | null;
  isDisabled?: boolean;
  placeholder: string;
}

/**
 * A rich text field that mounts the (heavy) editor only when the person activates it.
 * Used where many descriptions appear at once (e.g. one per card), so revealing them is instant.
 */
export function DeferredRichTextEditor({ label, value, onChange, error, isDisabled, placeholder }: DeferredRichTextEditorProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const doc = value ?? { type: 'doc', content: [] };

  if (active) return <RichTextEditor label={label} value={doc} onChange={onChange} error={error} isDisabled={isDisabled} size="compact" autoFocus />;

  const empty = isRichTextEmpty(doc);
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setActive(true)}
        onFocus={() => !isDisabled && setActive(true)}
        aria-label={`${label}: ${t('studies.editor.edit')}`}
        className="min-h-20 rounded-2xl border border-field-border bg-field px-3 py-2.5 text-left text-sm transition-colors hover:border-border-tertiary disabled:opacity-70"
      >
        {empty ? <span className="text-muted">{placeholder}</span> : <RichTextView doc={doc} className="gap-2 text-sm" />}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
