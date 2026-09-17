import type { ReactNode } from 'react';
import { Button as HeroButton } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

interface IconButtonProps {
  /** Required accessible name: icon-only controls are meaningless without it. */
  label: string;
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'secondary' | 'tertiary';
  onPress?: () => void;
  className?: string;
  id?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

export function IconButton({ label, icon, size = 'md', variant = 'ghost', className, ...rest }: IconButtonProps) {
  return (
    <HeroButton {...rest} isIconOnly aria-label={label} size={size} variant={variant} className={cn('rounded-full', className)}>
      <span aria-hidden="true" className="inline-flex [&>svg]:size-5">
        {icon}
      </span>
    </HeroButton>
  );
}
