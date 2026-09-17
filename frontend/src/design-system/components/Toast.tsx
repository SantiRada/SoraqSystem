import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type ToastTone = 'success' | 'danger' | 'warning' | 'info';

interface ToastProps {
  /** Kept rendered while hidden so the exit transition can play. */
  message: string;
  isVisible: boolean;
  /** Called after `duration` ms visible; the caller hides the toast. */
  onDismiss: () => void;
  duration?: number;
  tone?: ToastTone;
}

const icons = { success: CircleCheck, danger: CircleAlert, warning: TriangleAlert, info: Info };
const iconColor = { success: 'text-success', danger: 'text-danger', warning: 'text-warning', info: 'text-accent' };

/**
 * Non-blocking notification (saved, error, warning…) fixed at the bottom of the viewport, above everything.
 * Rendered in a portal on <body>, so its position never depends on the page layout or scroll.
 * Errors are announced assertively; the rest politely. Fades and slides (instant with reduced motion).
 */
export function Toast({ message, isVisible, onDismiss, duration, tone = 'success' }: ToastProps) {
  const visibleFor = duration ?? (tone === 'danger' ? 7000 : 2800);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onDismiss, visibleFor);
    return () => clearTimeout(timer);
  }, [isVisible, visibleFor, onDismiss]);

  const Icon = icons[tone];

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex justify-center px-4">
      {/* Live region changes only while visible, so every new toast is announced once. */}
      <span role={tone === 'danger' ? 'alert' : 'status'} className="sr-only">
        {isVisible ? message : null}
      </span>
      <div
        aria-hidden="true"
        className={cn(
          'flex max-w-xl items-center gap-2.5 rounded-full border border-border bg-overlay py-2.5 pe-5 ps-3.5 text-sm font-medium text-foreground shadow-lg shadow-black/20 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          tone === 'danger' && 'rounded-2xl border-danger/50',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )}
      >
        <Icon aria-hidden="true" className={cn('size-[18px] shrink-0', iconColor[tone])} />
        {message}
      </div>
    </div>,
    document.body,
  );
}
