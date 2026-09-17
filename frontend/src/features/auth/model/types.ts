/** Mirrors backend User::toPublicArray(). */
export interface User {
  id: string;
  email: string;
  displayName: string;
  locale: string;
  timezone: string;
  /** Platform role. Admin grants platform administration only, never access to other users' projects. */
  role: UserRole;
  createdAt: string;
}

export type UserRole = 'user' | 'admin';

export interface SessionPayload {
  user: User | null;
  csrfToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
}

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

/** Must match backend AuthService::PASSWORD_MIN. */
export const PASSWORD_MIN_LENGTH = 12;
