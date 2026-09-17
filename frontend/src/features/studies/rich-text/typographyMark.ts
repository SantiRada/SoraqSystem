import { Mark, mergeAttributes } from '@tiptap/core';
import type { RichFont, RichSize, RichWeight } from '../model/types';
import { FONTS, SIZES, WEIGHTS, typographyClass } from './typography';

export { FONTS, SIZES, WEIGHTS };

type TypographyAttrs = { font: RichFont | null; size: RichSize | null; weight: RichWeight | null };

function classFor(attrs: Partial<TypographyAttrs>): string {
  return [
    attrs.font && FONTS.includes(attrs.font) ? typographyClass.font[attrs.font] : null,
    attrs.size && SIZES.includes(attrs.size) ? typographyClass.size[attrs.size] : null,
    attrs.weight && WEIGHTS.includes(attrs.weight) ? typographyClass.weight[attrs.weight] : null,
  ]
    .filter(Boolean)
    .join(' ');
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    typography: {
      setTypography: (attrs: Partial<TypographyAttrs>) => ReturnType;
    };
  }
}

/** Font family, size and weight as one mark with enumerated values (mirrors backend RichText::typography). */
export const Typography = Mark.create({
  name: 'typography',

  addAttributes() {
    return {
      font: { default: null, parseHTML: (el) => el.getAttribute('data-font'), renderHTML: () => ({}) },
      size: { default: null, parseHTML: (el) => el.getAttribute('data-size'), renderHTML: () => ({}) },
      weight: { default: null, parseHTML: (el) => el.getAttribute('data-weight'), renderHTML: () => ({}) },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-typography]' }];
  },

  renderHTML({ mark, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-typography': '', class: classFor(mark.attrs as TypographyAttrs) }), 0];
  },

  addCommands() {
    return {
      setTypography:
        (attrs) =>
        ({ editor, chain }) => {
          const next = { ...(editor.getAttributes('typography') as TypographyAttrs), ...attrs };
          if (!next.font && !next.size && !next.weight) return chain().unsetMark('typography').run();
          return chain().setMark('typography', next).run();
        },
    };
  },
});
