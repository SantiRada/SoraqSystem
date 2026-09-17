import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onUnauthenticated } from '@/shared/api/httpClient';
import { authApi } from '../api/authApi';
import type { AuthStatus, LoginInput, RegisterInput, User } from '../model/types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    authApi
      .getSession(controller.signal)
      .then(({ user: sessionUser }) => {
        setUser(sessionUser);
        setStatus(sessionUser ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });

    return () => controller.abort();
  }, [checkVersion]);

  // Session expired server-side while the app was open → drop to anonymous (guards redirect to login).
  useEffect(
    () =>
      onUnauthenticated(() => {
        setUser(null);
        setStatus('anonymous');
      }),
    [],
  );

  const login = useCallback(async (input: LoginInput) => {
    const { user: loggedIn } = await authApi.login(input);
    if (!loggedIn) throw new Error('Login response without user');
    setUser(loggedIn);
    setStatus('authenticated');
    return loggedIn;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: created } = await authApi.register(input);
    if (!created) throw new Error('Register response without user');
    setUser(created);
    setStatus('authenticated');
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const refresh = useCallback(() => {
    setStatus('checking');
    setCheckVersion((v) => v + 1);
  }, []);

  const updateUser = useCallback((next: User) => setUser(next), []);

  const endSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, register, logout, refresh, updateUser, endSession }),
    [status, user, login, register, logout, refresh, updateUser, endSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
