import { cn } from '@/shared/lib/cn';

interface LogoProps {
  /** 'full' = mark + wordmark; 'mark' = symbol only (the parent link provides the name). */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' } as const;

/** Soraq logo: decorative SVG + real text (readable and translatable). docs/BRAND.md → Logo. */
export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', sizes[size], className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="size-[1.5em] shrink-0">
        <defs>
          <linearGradient id="soraq-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5b8cff" />
            <stop offset="1" stopColor="#2f5fe0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#soraq-mark)" />
        <path
          d="M21.5 9H13a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8h-8.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={variant === 'mark' ? 'sr-only' : 'font-semibold leading-none tracking-tight'}>Soraq</span>
    </span>
  );
}
