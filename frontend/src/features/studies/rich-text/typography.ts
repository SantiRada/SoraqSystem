import type { RichFont, RichSize, RichWeight } from '../model/types';

export const FONTS: RichFont[] = ['sans', 'serif', 'mono'];
export const SIZES: RichSize[] = ['sm', 'lg', 'xl'];
export const WEIGHTS: RichWeight[] = ['medium', 'semibold'];

/** Tailwind classes per allowed value. Values outside the allowlist are never rendered (no inline styles). */
export const typographyClass = {
  font: { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono' },
  size: { sm: 'text-sm', lg: 'text-lg', xl: 'text-xl' },
  weight: { medium: 'font-medium', semibold: 'font-semibold' },
} as const;
