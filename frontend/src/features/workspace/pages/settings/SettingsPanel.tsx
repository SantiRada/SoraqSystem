import type { ReactNode } from 'react';
import { Card } from '@/design-system';
import { cn } from '@/shared/lib/cn';

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Visual emphasis for destructive areas (border + title in danger tone, never color alone). */
  tone?: 'default' | 'danger';
  headingId: string;
}

/** A titled settings block. Used by every settings page for a consistent layout. */
export function SettingsPanel({ title, description, children, tone = 'default', headingId }: SettingsPanelProps) {
  return (
    <Card className={cn('gap-5 rounded-3xl border bg-surface p-6 md:p-8', tone === 'danger' ? 'border-danger/60' : 'border-border')}>
      <section aria-labelledby={headingId} className="grid gap-5">
        <header>
          <h2 id={headingId} className={cn('text-lg font-semibold tracking-tight', tone === 'danger' && 'text-danger')}>
            {title}
          </h2>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
        </header>
        {children}
      </section>
    </Card>
  );
}
