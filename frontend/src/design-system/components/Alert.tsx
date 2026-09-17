import type { ReactNode } from 'react';
import { Alert as HeroAlert } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const status = { info: 'accent', success: 'success', warning: 'warning', danger: 'danger' } as const;

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Inline feedback. Tone = icon + title + color (never color alone).
 * Danger interrupts (role="alert"); the rest is polite (role="status").
 */
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  return (
    <HeroAlert status={status[tone]} role={tone === 'danger' ? 'alert' : 'status'} className={cn('items-start', className)}>
      <HeroAlert.Indicator />
      <HeroAlert.Content>
        {title && <HeroAlert.Title>{title}</HeroAlert.Title>}
        {children && <HeroAlert.Description>{children}</HeroAlert.Description>}
      </HeroAlert.Content>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </HeroAlert>
  );
}
