import { Link, NavLink } from 'react-router';
import { ArrowLeft, House, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton, Logo } from '@/design-system';
import { paths } from '@/config/paths';
import { AccountMenu } from '@/features/account';
import type { Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { projectNavigation } from '../config/projectNavigation';
import { shortcutDigit, shortcutSections } from '../hooks/useWorkspaceShortcuts';
import { RailLink } from './RailLink';

interface PrimaryNavProps {
  project: Project;
  /** Icon rail vs. expanded list. The user chooses on desktop; the mobile drawer is always expanded. */
  collapsed: boolean;
  /** Desktop only: shows the collapse/expand control next to the logo. */
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}

const TOGGLE_ID = 'workspace-sidebar-toggle';

/** "Control+1" for the section's position (see useWorkspaceShortcuts), or undefined. */
function sectionShortcut(sectionId: string): string | undefined {
  const digit = shortcutDigit(shortcutSections.findIndex((section) => section.id === sectionId));
  return digit ? `Control+${digit}` : undefined;
}

/**
 * Primary project navigation: level 1 groups (non-clickable labels) and level 2 sections.
 * Expanded: labels + text links. Collapsed: icon rail with separators between groups.
 * Level 3 items are not listed here: section pages link to them and ItemSwitcher moves between them.
 */
export function PrimaryNav({ project, collapsed, onToggleCollapsed, onNavigate }: PrimaryNavProps) {
  const { t } = useI18n();
  const overviewPath = paths.project(project.id);

  // The toggle is re-rendered in another place of the tree: keep keyboard focus on it.
  const toggle = onToggleCollapsed
    ? () => {
        onToggleCollapsed();
        setTimeout(() => document.getElementById(TOGGLE_ID)?.focus(), 0);
      }
    : undefined;

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center gap-3 py-4">
        <Link to={paths.projects} aria-label={t('workspace.allProjects')} className="inline-flex rounded-xl p-1">
          <Logo variant="mark" size="md" />
        </Link>
        {toggle && (
          <IconButton id={TOGGLE_ID} size="sm" label={t('workspace.expandSidebar')} icon={<PanelLeftOpen />} aria-expanded={false} aria-controls="workspace-sidebar" onPress={toggle} />
        )}

        <nav aria-label={t('workspace.projectNavigation')} className="flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto">
          <RailLink to={overviewPath} end label={t('workspace.overview')} icon={House} />
          {projectNavigation.map((group) => (
            <ul key={group.id} aria-label={t(group.labelKey)} className="flex w-full list-none flex-col items-center gap-1 border-t border-separator p-0 pt-3">
              {group.sections.map((section) => (
                <li key={section.id}>
                  <RailLink to={paths.projectSection(project.id, section.id)} label={t(section.titleKey)} icon={section.icon} shortcut={sectionShortcut(section.id)} />
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <div className="border-t border-separator pt-3">
          <AccountMenu variant="compact" placement="right bottom" projectSettingsHref={paths.projectSettings(project.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5 px-3 py-4">
      <div className="px-2">
        <div className="flex items-center justify-between gap-2">
          <Link to={paths.projects} aria-label={t('common.a11y.appHomeLink')} className="inline-flex rounded-lg">
            <Logo />
          </Link>
          {toggle && (
            <IconButton id={TOGGLE_ID} size="sm" label={t('workspace.collapseSidebar')} icon={<PanelLeftClose />} aria-expanded aria-controls="workspace-sidebar" onPress={toggle} className="-me-2" />
          )}
        </div>
        <Link
          to={paths.projects}
          onClick={onNavigate}
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted no-underline hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          {t('workspace.allProjects')}
        </Link>
        <p className="mt-1 truncate text-sm font-semibold" title={project.name}>
          {project.name}
        </p>
      </div>

      <nav aria-label={t('workspace.projectNavigation')} className="flex flex-1 flex-col gap-5 overflow-y-auto">
        <NavItem to={overviewPath} end icon={House} label={t('workspace.overview')} onNavigate={onNavigate} />
        {projectNavigation.map((group) => (
          <div key={group.id}>
            {/* Level 1: label only, not interactive. */}
            <p id={`nav-group-${group.id}`} className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t(group.labelKey)}
            </p>
            <ul aria-labelledby={`nav-group-${group.id}`} className="grid list-none gap-0.5 p-0">
              {group.sections.map((section) => (
                <li key={section.id}>
                  <NavItem
                    to={paths.projectSection(project.id, section.id)}
                    icon={section.icon}
                    label={t(section.titleKey)}
                    shortcut={sectionShortcut(section.id)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-separator pt-3">
        <AccountMenu variant="full" projectSettingsHref={paths.projectSettings(project.id)} />
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  shortcut,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof House;
  end?: boolean;
  shortcut?: string;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-keyshortcuts={shortcut}
      className={({ isActive }) =>
        cn(
          'group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted no-underline transition-colors hover:bg-default-soft hover:text-foreground',
          isActive && 'bg-default font-medium text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className={cn('size-[18px] shrink-0', isActive && 'text-accent-soft-foreground')} />
          {label}
          {/* Shortcut hint on hover / keyboard focus only, to keep the list calm. */}
          {shortcut && (
            <kbd aria-hidden="true" className="ms-auto hidden font-sans text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:inline">
              {shortcut.replace('Control', 'Ctrl')}
            </kbd>
          )}
        </>
      )}
    </NavLink>
  );
}
