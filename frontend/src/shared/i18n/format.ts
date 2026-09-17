/**
 * Locale-aware formatting. ALWAYS use these helpers (or Intl directly) —
 * never format dates, numbers or money by hand.
 *
 * - The API sends dates as ISO 8601 UTC; conversion to the viewer's timezone happens here.
 * - Money is represented as integer minor units + ISO 4217 currency code.
 */
export interface FormatOptions {
  /** BCP 47 locale, e.g. 'en', 'es-AR', 'pt-BR'. Defaults to the interface language. */
  locale?: string;
  /** IANA timezone, e.g. 'UTC', 'America/New_York'. Defaults to the browser timezone. */
  timeZone?: string;
}

/**
 * Formatting follows the INTERFACE language (<html lang>), not the browser locale:
 * formatted words ("yesterday", month names) are part of the sentence around them,
 * and mixing languages ("Updated este minuto") hurts readability.
 * Timezone still follows the browser. When users can pick a locale, pass it explicitly.
 */
export function defaultLocale(): string {
  return (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
}

export function formatDate(iso: string, { locale = defaultLocale(), timeZone }: FormatOptions = {}): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(new Date(iso));
}

export function formatDateTime(iso: string, { locale = defaultLocale(), timeZone }: FormatOptions = {}): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(iso));
}

export function formatRelativeTime(iso: string, { locale = defaultLocale() }: FormatOptions = {}, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(0, 'minute');
}

export function formatNumber(value: number, { locale = defaultLocale() }: FormatOptions = {}): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatMoney(amountMinor: number, currency: string, { locale = defaultLocale() }: FormatOptions = {}): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}
