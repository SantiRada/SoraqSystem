import { Spinner } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

/** Loading feedback. `label` says WHAT is loading ("Cargando tus proyectos…"). */
export function LoadingState({ label, fill = false, className }: { label: string; fill?: boolean; className?: string }) {
  return (
    <div role="status" data-animate-enter className={cn('flex items-center justify-center gap-3 px-4 py-10 text-sm text-muted', fill && 'min-h-[60dvh]', className)}>
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}
