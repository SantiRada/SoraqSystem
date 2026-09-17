import { useEffect, useId, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Italic, List, ListOrdered, Minus } from 'lucide-react';
import { IconButton, SelectField, ToggleButton } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import type { RichDoc } from '../model/types';
import { FONTS, Typography } from './typographyMark';

interface RichTextEditorProps {
  label: string;
  value: RichDoc;
  onChange: (doc: RichDoc) => void;
  hint?: string;
  error?: string | null;
  isDisabled?: boolean;
  /** Visually hide the label (still associated with the editor). */
  hideLabel?: boolean;
  /** 'compact' short descriptions · 'default' · 'tall' long texts (Flujo). */
  size?: 'compact' | 'default' | 'tall';
  autoFocus?: boolean;
}

const EMPTY: RichDoc = { type: 'doc', content: [] };

/**
 * Description editor with a visible toolbar: heading, weight, font, italic, bullet / numbered lists and divider.
 * Ctrl/Cmd+B toggles bold and Ctrl/Cmd+I italic (Tiptap keymaps). Output is JSON restricted to the
 * backend allowlist (RichText.php) — no HTML is stored.
 */
export function RichTextEditor({ label, value, onChange, hint, error, isDisabled, hideLabel, size = 'default', autoFocus }: RichTextEditorProps) {
  const { t } = useI18n();
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: false,
        bulletList: { HTMLAttributes: { class: 'list-disc ps-5' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal ps-5' } },
        horizontalRule: { HTMLAttributes: { class: 'my-2 border-separator' } },
      }),
      Typography,
    ],
    content: value?.content?.length ? value : EMPTY,
    editable: !isDisabled,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': 'true' } : {}),
        class: cn(
          'grid gap-2 px-3 py-2.5 text-sm leading-relaxed outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li>p]:inline',
          size === 'compact' ? 'min-h-20' : size === 'tall' ? 'min-h-56' : 'min-h-32',
        ) ?? '',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as RichDoc),
  });

  // Keep the editor in sync when the value is replaced from outside (e.g. discard changes).
  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(value?.content?.length ? value : EMPTY);
    if (incoming !== JSON.stringify(editor.getJSON())) editor.commands.setContent(value?.content?.length ? value : EMPTY, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!isDisabled);
  }, [editor, isDisabled]);

  return (
    <div className="grid gap-1.5">
      <span id={labelId} className={cn('text-sm font-medium', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div
        className={cn(
          'overflow-hidden rounded-2xl border bg-field transition-colors focus-within:border-focus',
          error ? 'border-danger' : 'border-field-border',
          isDisabled && 'opacity-70',
        )}
      >
        {editor && !isDisabled && <Toolbar editor={editor} label={t('studies.editor.toolbar', { field: label })} />}
        <EditorContent editor={editor} />
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Toolbar({ editor, label }: { editor: Editor; label: string }) {
  const { t } = useI18n();
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      weight: e.isActive('bold') ? 'bold' : ((e.getAttributes('typography').weight as string | null) ?? 'normal'),
      font: (e.getAttributes('typography').font as string | null) ?? 'sans',
      italic: e.isActive('italic'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label={label} className="flex flex-wrap items-center gap-1 border-b border-separator bg-surface-secondary/60 px-2 py-1.5">
      <SelectField
        hideLabel
        label={t('studies.editor.block')}
        className="w-32"
        value={state.block}
        onChange={(v) => (v === 'p' ? chain().setParagraph().run() : chain().setHeading({ level: v === 'h2' ? 2 : 3 }).run())}
        options={[
          { id: 'p', label: t('studies.editor.paragraph') },
          { id: 'h2', label: t('studies.editor.heading') },
          { id: 'h3', label: t('studies.editor.subheading') },
        ]}
      />
      <SelectField
        hideLabel
        label={t('studies.editor.weight')}
        className="w-32"
        value={state.weight}
        onChange={(v) => {
          if (v === 'bold') chain().setBold().setTypography({ weight: null }).run();
          else chain().unsetBold().setTypography({ weight: v === 'normal' ? null : (v as 'medium' | 'semibold') }).run();
        }}
        options={[
          { id: 'normal', label: t('studies.editor.weightNormal') },
          { id: 'medium', label: t('studies.editor.weightMedium') },
          { id: 'semibold', label: t('studies.editor.weightSemibold') },
          { id: 'bold', label: t('studies.editor.weightBold') },
        ]}
      />
      <SelectField
        hideLabel
        label={t('studies.editor.font')}
        className="w-28"
        value={state.font}
        onChange={(v) => chain().setTypography({ font: v === 'sans' ? null : (v as (typeof FONTS)[number]) }).run()}
        options={FONTS.map((f) => ({ id: f, label: t(`studies.editor.fonts.${f}`) }))}
      />
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-separator" />
      <ToolbarToggle label={t('studies.editor.italic')} isSelected={state.italic} onChange={() => chain().toggleItalic().run()} icon={<Italic />} />
      <ToolbarToggle label={t('studies.editor.bulletList')} isSelected={state.bullet} onChange={() => chain().toggleBulletList().run()} icon={<List />} />
      <ToolbarToggle label={t('studies.editor.orderedList')} isSelected={state.ordered} onChange={() => chain().toggleOrderedList().run()} icon={<ListOrdered />} />
      <IconButton size="sm" className="size-9 min-w-9 rounded-xl [&_svg]:size-4" label={t('studies.editor.divider')} onPress={() => chain().setHorizontalRule().run()} icon={<Minus />} />
    </div>
  );
}

function ToolbarToggle({ label, isSelected, onChange, icon }: { label: string; isSelected: boolean; onChange: () => void; icon: ReactNode }) {
  return (
    <ToggleButton
      aria-label={label}
      isSelected={isSelected}
      onChange={onChange}
      isIconOnly
      size="sm"
      className="size-9 min-w-9 rounded-xl data-[selected=true]:bg-default [&_svg]:size-4"
    >
      {icon}
    </ToggleButton>
  );
}
