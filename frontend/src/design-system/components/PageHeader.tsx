import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** The page's single <h1> (receives focus after navigation). */
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-3 text-sm text-muted">{eyebrow}</div>}
        <h1 tabIndex={-1} data-page-heading className="text-3xl font-semibold tracking-tight [overflow-wrap:anywhere] md:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
