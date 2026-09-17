import type { messages } from './locales/es';

/**
 * The Spanish catalog is the SOURCE OF TRUTH for the shape of every language.
 * Other catalogs are declared as `Messages`, so a missing or extra key is a type error.
 */
export type Messages = typeof messages;

/** Plural message resolved with Intl.PluralRules (`{count}` is interpolated). */
export interface PluralMessage {
  one: string;
  other: string;
  zero?: string;
}

type Leaf = string | PluralMessage;

/** Dot-separated paths to every translatable leaf: 'auth.login.title'. */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : T[K] extends object ? `${K}.${Paths<T[K]>}` : never;
}[keyof T & string];

export type MessageKey = Paths<Messages>;

export type MessageParams = Record<string, string | number>;
