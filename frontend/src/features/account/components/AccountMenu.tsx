import { useLocation, useNavigate } from 'react-router';
import { ChevronsUpDown, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { Badge, Dropdown } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth, UserAvatar, useSignOutConfirmation } from '@/features/auth';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { useTheme } from '@/shared/theme/ThemeContext';

interface AccountMenuProps {
  /**
   * 'full'    avatar + name + email (expanded sidebar)
   * 'compact' avatar only (icon rail)
   * 'chip'    avatar + name on ≥ md (floating corner controls)
   */
  variant?: 'full' | 'compact' | 'chip';
  placement?: 'top start' | 'right bottom' | 'bottom end';
  /** Inside a project: adds "Configuración del proyecto" linking here. */
  projectSettingsHref?: string;
}

/** Account menu (React Aria menu): Perfil (page), project settings (inside a project), theme switch and sign out (confirmed). */
export function AccountMenu({ variant = 'full', placement = 'top start', projectSettingsHref }: AccountMenuProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const signOut = useSignOutConfirmation();

  if (!user) return null;

  const themeLabel = theme === 'dark' ? t('common.theme.toLight') : t('common.theme.toDark');

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger
          aria-label={t('common.a11y.accountMenu')}
          className={cn(
            'flex items-center gap-3 text-left transition-colors hover:bg-default-soft',
            variant === 'compact' && 'size-11 justify-center rounded-2xl p-0',
            variant === 'full' && 'w-full rounded-2xl p-2',
            variant === 'chip' && 'rounded-full py-0.5 pe-2 ps-0.5',
          )}
        >
          <UserAvatar user={user} />
          {variant === 'full' && (
            <>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{user.displayName}</span>
                  {user.role === 'admin' && <Badge tone="accent">{t('common.roles.admin')}</Badge>}
                </span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
              <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </>
          )}
          {variant === 'chip' && (
            <>
              <span className="hidden text-sm font-medium md:inline">{user.displayName}</span>
              {user.role === 'admin' && (
                <Badge tone="accent" className="hidden md:inline-flex">
                  {t('common.roles.admin')}
                </Badge>
              )}
            </>
          )}
        </Dropdown.Trigger>
        <Dropdown.Popover placement={placement} className="min-w-60">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === 'profile')
                navigate(paths.account('profile'), {
                  state: { from: pathname },
                });
              if (key === 'project-settings' && projectSettingsHref) navigate(projectSettingsHref);
              if (key === 'theme') toggleTheme();
              if (key === 'sign-out') signOut.requestSignOut();
            }}
          >
            <Dropdown.Item id="profile" textValue={t('account.menu.profile')} className="gap-2">
              <UserRound aria-hidden="true" className="size-4" />
              {t('account.menu.profile')}
            </Dropdown.Item>
            {projectSettingsHref ? (
              <Dropdown.Item id="project-settings" textValue={t('account.menu.projectSettings')} className="gap-2">
                <Settings aria-hidden="true" className="size-4" />
                {t('account.menu.projectSettings')}
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id="theme" textValue={themeLabel} className="gap-2">
              {theme === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
              {themeLabel}
            </Dropdown.Item>
            <Dropdown.Item id="sign-out" textValue={t('common.actions.signOut')} className="gap-2">
              <LogOut aria-hidden="true" className="size-4" />
              {t('common.actions.signOut')}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {signOut.dialog}
    </>
  );
}
