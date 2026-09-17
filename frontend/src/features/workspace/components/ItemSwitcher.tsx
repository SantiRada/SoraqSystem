import { Fragment } from 'react';
import { NavLink } from 'react-router';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { isSubgroup, sectionItems, type WorkspaceItem, type WorkspaceSection } from '../config/projectNavigation';
import { shortcutDigit } from '../hooks/useWorkspaceShortcuts';

interface ItemSwitcherProps {
  projectId: string;
  section: WorkspaceSection;
}

/**
 * Level 3 navigation: a bar at the top of a level 3 page listing the other items
 * of the same section (e.g. Desktop Research → Benchmarking). Scrolls away with the page, left-aligned, scrolls
 * horizontally when items don't fit. Subgroup names are non-interactive separators.
 * Mounted by the workspace shell only on level 3 routes, so it persists (no re-animation) between siblings.
 */
export function ItemSwitcher({ projectId, section }: ItemSwitcherProps) {
  const { t } = useI18n();

  return (
    <div className="mb-8 flex justify-start">
      <nav
        aria-label={t('workspace.sectionNavigation', { section: t(section.titleKey) })}
        className="max-w-full overflow-x-auto rounded-2xl border border-border bg-surface/85 p-1 shadow-lg shadow-black/10 backdrop-blur-xl"
      >
        <ul className="flex w-max list-none items-center gap-1 p-0">
          {section.children.map((child, index) =>
            isSubgroup(child) ? (
              <Fragment key={child.id}>
                <li className={cn('px-2 text-[11px] font-semibold uppercase tracking-wider text-muted', index > 0 && 'ms-1 border-s border-separator ps-3')}>
                  {t(child.labelKey)}
                </li>
                {child.items.map((item) => (
                  <li key={item.id}>
                    <ItemLink projectId={projectId} section={section} item={item} />
                  </li>
                ))}
              </Fragment>
            ) : (
              <li key={child.id}>
                <ItemLink projectId={projectId} section={section} item={child} />
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}

function ItemLink({ projectId, section, item }: { projectId: string; section: WorkspaceSection; item: WorkspaceItem }) {
  const { t } = useI18n();
  const digit = shortcutDigit(sectionItems(section).findIndex((i) => i.id === item.id));

  return (
    <NavLink
      to={paths.projectItem(projectId, section.id, item.id)}
      aria-keyshortcuts={digit ? `Shift+${digit}` : undefined}
      title={digit ? `Shift+${digit}` : undefined}
      className={({ isActive }) =>
        cn(
          'flex min-h-9 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm text-muted no-underline transition-colors hover:bg-default-soft hover:text-foreground',
          isActive && 'bg-default font-medium text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {item.icon && <item.icon aria-hidden="true" className={cn('size-4', isActive && 'text-accent-soft-foreground')} />}
          {t(item.labelKey)}
          {!item.icon && <span className="sr-only">, {t('workspace.status.notStarted')}</span>}
        </>
      )}
    </NavLink>
  );
}
