import { NavLink } from 'react-router';
import { PenLine, Trash2, Users } from 'lucide-react';
import { paths, type ProjectSettingsTab } from '@/config/paths';
import { useI18n, type MessageKey } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { useWorkspace } from '../../context/WorkspaceContext';

const tabs = [
  { id: 'general', labelKey: 'workspace.settings.nav.general', icon: PenLine },
  { id: 'access', labelKey: 'workspace.settings.nav.access', icon: Users },
  { id: 'delete', labelKey: 'workspace.settings.nav.delete', icon: Trash2 },
] as const satisfies ReadonlyArray<{ id: ProjectSettingsTab; labelKey: MessageKey; icon: typeof PenLine }>;

/**
 * Local navigation between project settings pages. Settings are opened from the account menu
 * (not the project sidebar), so each page carries this link bar. Links, not ARIA tabs: each is a route.
 */
export function SettingsNav() {
  const { t } = useI18n();
  const { project } = useWorkspace();

  return (
    <nav aria-label={t('workspace.settings.navLabel')} className="-mt-4 mb-8 overflow-x-auto">
      <ul className="flex w-max list-none gap-1 rounded-2xl border border-border bg-surface p-1">
        {tabs.map(({ id, labelKey, icon: Icon }) => (
          <li key={id}>
            <NavLink
              to={paths.projectSettings(project.id, id)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm text-muted no-underline transition-colors hover:bg-default-soft hover:text-foreground',
                  isActive && 'bg-default font-medium text-foreground',
                )
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {t(labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
