import { Avatar } from '@/design-system';
import type { User } from '../model/types';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Initials avatar (no uploaded photos yet). Decorative: the name is always shown or announced nearby. */
export function UserAvatar({ user, size = 'sm' }: { user: Pick<User, 'displayName'>; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Avatar size={size}>
      <Avatar.Fallback>{initials(user.displayName)}</Avatar.Fallback>
    </Avatar>
  );
}
