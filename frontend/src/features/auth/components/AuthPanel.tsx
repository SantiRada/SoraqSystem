import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

interface AuthPanelProps {
  title: string;
  description: string;
  children: ReactNode;
  /** Prompt + link to the alternative flow ("¿Nuevo en Soraq? Crea una cuenta"). */
  switchPrompt: string;
  switchLabel: string;
  switchTo: LinkProps['to'];
  switchState?: unknown;
}

export function AuthPanel({ title, description, children, switchPrompt, switchLabel, switchTo, switchState }: AuthPanelProps) {
  return (
    <section aria-labelledby="auth-title" className="w-full">
      <header className="mb-8">
        <h1 id="auth-title" tabIndex={-1} data-page-heading className="text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-muted">{description}</p>
      </header>
      {children}
      <p className="mt-8 text-center text-sm text-muted">
        {switchPrompt}{' '}
        <Link to={switchTo} state={switchState} className="font-medium text-link underline-offset-4 hover:underline">
          {switchLabel}
        </Link>
      </p>
    </section>
  );
}
