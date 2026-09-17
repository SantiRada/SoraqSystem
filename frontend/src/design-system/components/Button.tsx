import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Button as HeroButton, Spinner, buttonVariants } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

/**
 * Soraq variants on top of HeroUI:
 *  - contrast  → white pill on black (Framer/Antigravity primary CTA). Max. 1 per view region.
 *  - primary   → accent (electric blue). Main action inside the product.
 *  - secondary / tertiary / outline / ghost → HeroUI equivalents.
 *  - danger    → destructive actions.
 */
export type ButtonVariant = 'contrast' | 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const heroVariant = {
  contrast: 'primary',
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'danger',
} as const;

const CONTRAST = 'bg-foreground text-background hover:bg-foreground/90 data-[hovered=true]:bg-foreground/90';

function buttonClass(variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, className?: string) {
  return cn(
    buttonVariants({ variant: heroVariant[variant], size, fullWidth }),
    'rounded-full font-medium',
    variant === 'contrast' && CONTRAST,
    className,
  );
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export interface ButtonProps extends CommonProps {
  type?: 'button' | 'submit' | 'reset';
  /** Associates a submit button placed outside its <form> (e.g. dialog footers). */
  form?: string;
  onPress?: () => void;
  isDisabled?: boolean;
  /** Pending state: spinner, aria-busy, presses ignored, focus kept. */
  isLoading?: boolean;
  autoFocus?: boolean;
}

/** Actions. For navigation use ButtonLink. */
export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  isLoading = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <HeroButton {...rest} isPending={isLoading} className={buttonClass(variant, size, fullWidth, className)}>
      {isLoading ? <Spinner size="sm" color="current" /> : leadingIcon && <Icon>{leadingIcon}</Icon>}
      {children}
      {!isLoading && trailingIcon && <Icon>{trailingIcon}</Icon>}
    </HeroButton>
  );
}

export interface ButtonLinkProps extends CommonProps, Omit<LinkProps, 'className' | 'children'> {}

/** Navigation styled as a button (renders a real <a>). */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={buttonClass(variant, size, fullWidth, cn('no-underline', className))}>
      {leadingIcon && <Icon>{leadingIcon}</Icon>}
      {children}
      {trailingIcon && <Icon>{trailingIcon}</Icon>}
    </Link>
  );
}

export interface ButtonAnchorProps extends CommonProps {
  /** In-page anchors ("#producto") or external URLs. For app routes use ButtonLink. */
  href: string;
  /** Open in a new tab (adds rel="noopener noreferrer"). */
  newTab?: boolean;
}

/** Native <a> styled as a button. */
export function ButtonAnchor({
  variant = 'secondary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  href,
  newTab = false,
}: ButtonAnchorProps) {
  return (
    <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} className={buttonClass(variant, size, fullWidth, cn('no-underline', className))}>
      {leadingIcon && <Icon>{leadingIcon}</Icon>}
      {children}
      {trailingIcon && <Icon>{trailingIcon}</Icon>}
    </a>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
      {children}
    </span>
  );
}
