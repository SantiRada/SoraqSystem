import type { ReactNode } from 'react';
import { EmptyState as HeroEmptyState } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** Why it is empty and what the user gains by acting. */
  description?: ReactNode;
  /** Usually ONE action that resolves the empty state. */
  action?: ReactNode;
  /** 'h1' when the empty state IS the page (e.g. not found): receives route focus. */
  headingLevel?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function EmptyState({ icon, title, description, action, headingLevel: Heading = 'h2', className }: EmptyStateProps) {
  const isPageHeading = Heading === 'h1';

  return (
    <HeroEmptyState
      data-animate-enter
      className={cn(
        'flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div aria-hidden="true" className="mb-2 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-soft-foreground [&>svg]:size-6">
          {icon}
        </div>
      )}
      <Heading className="text-lg font-semibold tracking-tight" tabIndex={isPageHeading ? -1 : undefined} data-page-heading={isPageHeading || undefined}>
        {title}
      </Heading>
      {description && <p className="max-w-md text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </HeroEmptyState>
  );
}
