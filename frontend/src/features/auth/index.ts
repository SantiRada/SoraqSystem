/** Public API of the auth feature. Other code imports ONLY from '@/features/auth'. */
export { UserAvatar, initials } from './components/UserAvatar';
export { SignOutButton } from './components/SignOutButton';
export { useSignOutConfirmation } from './components/useSignOutConfirmation';
export { AuthProvider } from './context/AuthProvider';
export { useAuth } from './context/AuthContext';
export { RedirectIfAuthenticated, RequireAuth } from './guards/guards';
export { authRoutes } from './routes';
export { PASSWORD_MIN_LENGTH } from './model/types';
export type { User, UserRole } from './model/types';
