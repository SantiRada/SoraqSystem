import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: ReactNode;
  align?: 'center' | 'left';
}

export function SectionHeading({ id, eyebrow, title, description, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={cn('mb-12 md:mb-16', align === 'center' && 'mx-auto max-w-3xl text-center')}>
      <p className="mb-4 text-sm font-medium text-accent-soft-foreground">{eyebrow}</p>
      <h2 id={id} className="text-display text-4xl md:text-6xl">
        {title}
      </h2>
      {description && <p className="mt-5 text-lg text-muted">{description}</p>}
    </div>
  );
}
