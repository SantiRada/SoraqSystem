import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import type { RichDoc, RichNode } from '../model/types';
import { typographyClass } from './typography';

/**
 * Renders a stored rich text document with React elements only (no HTML strings, no inline styles).
 * Unknown nodes/marks are ignored, mirroring the backend allowlist.
 */
export function RichTextView({ doc, className }: { doc: RichDoc | null | undefined; className?: string }) {
  if (!doc?.content?.length) return null;
  return <div className={cn('rich-text grid gap-3 text-foreground/90', className)}>{renderNodes(doc.content)}</div>;
}

export function isRichTextEmpty(doc: RichDoc | null | undefined): boolean {
  const hasText = (node: RichNode): boolean => Boolean(node.text?.trim()) || node.type === 'horizontalRule' || (node.content ?? []).some(hasText);
  return !doc || !hasText(doc);
}

/** Plain text (for previews and accessible names). */
export function richTextToPlain(doc: RichDoc | null | undefined): string {
  const walk = (node: RichNode): string => node.text ?? (node.content ?? []).map(walk).join(node.type === 'doc' ? '\n' : ' ');
  return doc ? walk(doc).trim() : '';
}

function renderNodes(nodes: RichNode[]): ReactNode[] {
  return nodes.map((node, i) => renderNode(node, i));
}

function renderNode(node: RichNode, key: number): ReactNode {
  const children = node.content ? renderNodes(node.content) : null;
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>;
    case 'heading':
      return node.attrs?.level === 3 ? (
        <p key={key} className="text-base font-semibold text-foreground">
          {children}
        </p>
      ) : (
        <p key={key} className="text-lg font-semibold tracking-tight text-foreground">
          {children}
        </p>
      );
    case 'bulletList':
      return (
        <ul key={key} className="list-disc ps-5">
          {children}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start ?? 1} className="list-decimal ps-5">
          {children}
        </ol>
      );
    case 'listItem':
      return (
        <li key={key} className="[&>p]:inline">
          {children}
        </li>
      );
    case 'horizontalRule':
      return <hr key={key} className="border-separator" />;
    case 'hardBreak':
      return <br key={key} />;
    case 'text':
      return renderText(node, key);
    default:
      return null;
  }
}

function renderText(node: RichNode, key: number): ReactNode {
  let out: ReactNode = node.text ?? '';
  const classes: string[] = [];
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') out = <strong>{out}</strong>;
    else if (mark.type === 'italic') out = <em>{out}</em>;
    else if (mark.type === 'typography' && mark.attrs) {
      const { font, size, weight } = mark.attrs;
      if (font && font in typographyClass.font) classes.push(typographyClass.font[font]);
      if (size && size in typographyClass.size) classes.push(typographyClass.size[size]);
      if (weight && weight in typographyClass.weight) classes.push(typographyClass.weight[weight]);
    }
  }
  return classes.length ? (
    <span key={key} className={classes.join(' ')}>
      {out}
    </span>
  ) : (
    <span key={key}>{out}</span>
  );
}
