import { useRef, useState } from 'react';
import { NavLink } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface RailLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (the project overview link). */
  end?: boolean;
  /** Keyboard shortcut, e.g. "Control+1" (aria-keyshortcuts) shown after the label. */
  shortcut?: string;
}

/**
 * Icon-only link of the collapsed primary sidebar.
 * - Accessible name via aria-label; aria-current set by NavLink.
 * - Visual label on hover AND keyboard focus (not hover-only), dismissible with Escape (WCAG 1.4.13).
 * - Label is position:fixed so the rail can scroll without clipping it.
 *   (HeroUI Tooltip is not used: its trigger wraps children in a focusable role="button" div,
 *   which would nest interactive elements.)
 */
export function RailLink({ to, label, icon: Icon, end, shortcut }: RailLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [labelTop, setLabelTop] = useState<number | null>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setLabelTop(rect.top + rect.height / 2);
  };
  const hide = () => setLabelTop(null);

  return (
    <>
      <NavLink
        ref={ref}
        to={to}
        end={end}
        aria-label={label}
        aria-keyshortcuts={shortcut}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={hide}
        onKeyDown={(event) => event.key === 'Escape' && hide()}
        className={({ isActive }) =>
          cn(
            'grid size-11 place-items-center rounded-xl text-muted no-underline transition-colors hover:bg-default-soft hover:text-foreground',
            isActive && 'bg-default text-foreground',
          )
        }
      >
        {({ isActive }) => <Icon aria-hidden="true" className={cn('size-5', isActive && 'text-accent-soft-foreground')} />}
      </NavLink>
      {labelTop !== null && (
        <span
          aria-hidden="true"
          style={{ top: labelTop }}
          className="pointer-events-none fixed left-[4.75rem] z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-overlay px-2.5 py-1.5 text-xs font-medium text-foreground shadow-overlay"
        >
          {label}
          {shortcut && <kbd className="ms-2 font-sans text-muted">{shortcut.replace('Control', 'Ctrl')}</kbd>}
        </span>
      )}
    </>
  );
}
