import type { ReactNode } from 'react';
import { Chip } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const color = { neutral: 'default', accent: 'accent', success: 'success', warning: 'warning', danger: 'danger' } as const;

/** Short, non-interactive status label. The text carries the meaning, not the color. */
export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <Chip color={color[tone]} variant="soft" size="sm" className={cn('rounded-full', className)}>
      {children}
    </Chip>
  );
}
