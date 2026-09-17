import type { MessageKey, MessageParams, Messages, PluralMessage } from './types';

/**
 * Pure translation function (no React), usable in hooks, utilities and tests.
 *
 * - Interpolation: 'Hola, {name}' + { name: 'Ana' }.
 * - Plurals: { one: '{count} proyecto', other: '{count} proyectos' } + { count: 2 }.
 * - A missing key returns the key itself (visible in UI, logged in development).
 */
export function createTranslator(messages: Messages, locale: string) {
  const plurals = new Intl.PluralRules(locale);

  return function t(key: MessageKey, params?: MessageParams): string {
    const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);

    let template: string;
    if (typeof value === 'string') {
      template = value;
    } else if (isPlural(value)) {
      const count = Number(params?.count ?? 0);
      template = count === 0 && value.zero ? value.zero : plurals.select(count) === 'one' ? value.one : value.other;
    } else {
      if (import.meta.env.DEV) console.warn(`[i18n] Missing message: ${key}`);
      return key;
    }

    return params ? template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : template;
  };
}

export type Translate = ReturnType<typeof createTranslator>;

function isPlural(value: unknown): value is PluralMessage {
  return typeof value === 'object' && value !== null && 'one' in value && 'other' in value;
}
