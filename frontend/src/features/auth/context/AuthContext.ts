import { createContext, useContext } from 'react';
import type { AuthStatus, LoginInput, RegisterInput, User } from '../model/types';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-check the session (used by the "server unavailable" retry). */
  refresh: () => void;
  /** Replace the signed-in user after a profile change confirmed by the API. */
  updateUser: (user: User) => void;
  /** Drop the local session after the server already ended it (e.g. account deleted). */
  endSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Client-side auth state is for UX only (what to render, where to redirect).
 * It is NOT a security boundary: the backend authorizes every request.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
