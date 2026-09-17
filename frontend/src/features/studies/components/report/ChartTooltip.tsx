import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipAnchor {
  x: number;
  y: number;
}

/**
 * Floating detail for chart hover/focus. Fixed to the viewport next to the pointer (or the focused element),
 * so it stays readable at any scroll position, and flipped/clamped to stay on screen.
 * Decorative for assistive tech: charts announce the same text through their own live region.
 */
export function ChartTooltip({ anchor, children }: { anchor: TooltipAnchor | null; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const gap = 14;
    let left = anchor.x + gap;
    let top = anchor.y + gap;
    if (left + width > window.innerWidth - 8) left = anchor.x - width - gap;
    if (top + height > window.innerHeight - 8) top = anchor.y - height - gap;
    setPosition({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [anchor]);

  if (!anchor) return null;

  return createPortal(
    <div
      ref={ref}
      aria-hidden="true"
      // Position comes from pointer coordinates (numbers only).
      style={{ left: position?.left ?? -9999, top: position?.top ?? -9999 }}
      className="pointer-events-none fixed z-[100] max-w-80 rounded-2xl border border-border bg-overlay px-4 py-3 text-sm shadow-lg shadow-black/25"
    >
      {children}
    </div>,
    document.body,
  );
}
