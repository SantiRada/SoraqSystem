import type { Translate } from '@/i18n/translate';

/**
 * Normalised API error. UI decides WHAT to show from `kind`, never from raw status codes.
 * Messages from the server are already user-safe (see backend HttpException).
 */
export type ApiErrorKind =
  | 'network' // offline / server unreachable
  | 'validation' // 422 — field errors
  | 'unauthenticated' // 401 — not signed in / session expired
  | 'forbidden' // 403 — no permission / CSRF / origin
  | 'not_found' // 404 — missing OR not accessible (indistinguishable on purpose)
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly requestId: string | undefined;

  constructor(options: {
    kind: ApiErrorKind;
    status: number;
    code: string;
    message: string;
    fields?: Record<string, string>;
    requestId?: string;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields ?? {};
    this.requestId = options.requestId;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * User-facing message for any thrown value.
 * Server messages are already localised (Accept-Language); client-side failures use the catalog.
 */
export function toUserMessage(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.kind === 'network') return t('common.errors.network');
  if (error instanceof ApiError && error.message) return error.message;
  return t('common.errors.unknown');
}
