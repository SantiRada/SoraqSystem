import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Reveal } from '@/design-system';
import { cn } from '@/shared/lib/cn';

interface CollapsibleProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Header content (title, badges…). The whole header row is the toggle button. */
  header: ReactNode;
  /** Controls placed next to the toggle (e.g. drag handle, delete), outside the button. */
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** A panel whose body expands and collapses with animation. Heavy bodies mount on first open. */
export function Collapsible({ isOpen, onToggle, header, leading, trailing, children, className, contentClassName }: CollapsibleProps) {
  const contentId = useId();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {leading}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-1 text-left outline-none focus-visible:outline-2 focus-visible:outline-focus"
        >
          <span className="min-w-0 flex-1">{header}</span>
          <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 text-muted transition-transform duration-300', isOpen && 'rotate-180')} />
        </button>
        {trailing}
      </div>
      <Reveal id={contentId} isOpen={isOpen} lazy>
        <div className={contentClassName}>{children}</div>
      </Reveal>
    </div>
  );
}
