import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface RevealProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  /**
   * Mount the content only after it is opened the first time (then keep it mounted so closing animates).
   * Use for heavy content such as rich text editors.
   */
  lazy?: boolean;
  id?: string;
}

/**
 * Animated show/hide for content that appears and disappears (collapsible sections, fields revealed by a switch).
 * Height and opacity transition in both directions; hidden content is `inert` (not focusable, not announced).
 * Respects prefers-reduced-motion through the global rule in base.css.
 */
export function Reveal({ isOpen, children, className, lazy = false, id }: RevealProps) {
  const [hasOpened, setHasOpened] = useState(isOpen);
  if (isOpen && !hasOpened) setHasOpened(true);

  return (
    <div
      id={id}
      inert={!isOpen}
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]',
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className={cn('min-h-0 overflow-hidden', className)}>{!lazy || hasOpened ? children : null}</div>
    </div>
  );
}
