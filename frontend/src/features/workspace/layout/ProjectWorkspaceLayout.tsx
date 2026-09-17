import { useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { ArrowLeft, FolderSearch, Menu, RefreshCw } from 'lucide-react';
import { Alert, Button, ButtonLink, Drawer, EmptyState, IconButton, LoadingState, Logo, SkipLink } from '@/design-system';
import { paths } from '@/config/paths';
import { projectsApi, type Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { cn } from '@/shared/lib/cn';
import { PrimaryNav } from '../components/PrimaryNav';
import { ItemSwitcher } from '../components/ItemSwitcher';
import { findItem, findSection } from '../config/projectNavigation';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';
import { useWorkspaceShortcuts } from '../hooks/useWorkspaceShortcuts';

/**
 * Project workspace shell (docs/NAVIGATION.md):
 *  - One primary sidebar (groups + sections). The user collapses it to an ICON RAIL or expands it
 *    (preference saved per device).
 *  - Level 3 items are reached from the section page; on a level 3 page, ItemSwitcher (floating bar
 *    at the top of the content) moves between the section's items.
 *  - < lg                  → top bar + drawer with the same navigation.
 * The project is loaded once here; the API authorises access (404 if not owned).
 */
export function ProjectWorkspaceLayout() {
  const { projectId = '' } = useParams();
  // Remount per project so state never shows another project's data.
  return <Workspace key={projectId} projectId={projectId} />;
}

function Workspace({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const project = useApiQuery((signal) => projectsApi.get(projectId, signal), [projectId]);

  if (project.status === 'loading') {
    return <LoadingState label={t('workspace.loading')} fill />;
  }

  if (project.status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col px-4 py-5 md:px-6">
        <SkipLink />
        <Link to={paths.projects} aria-label={t('workspace.allProjects')} className="inline-flex self-start rounded-lg">
          <Logo />
        </Link>
        <main id="main-content" className="flex flex-1 items-center justify-center">
          {project.error.kind === 'not_found' ? (
            <EmptyState
              icon={<FolderSearch />}
              headingLevel="h1"
              title={t('workspace.notFoundTitle')}
              description={t('workspace.notFoundDescription')}
              action={
                <ButtonLink to={paths.projects} variant="secondary" leadingIcon={<ArrowLeft />}>
                  {t('workspace.allProjects')}
                </ButtonLink>
              }
            />
          ) : (
            <Alert
              tone="danger"
              title={t('workspace.errorTitle')}
              action={
                <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={project.reload}>
                  {t('common.actions.tryAgain')}
                </Button>
              }
            >
              {toUserMessage(project.error, t)}
            </Alert>
          )}
        </main>
      </div>
    );
  }

  return <WorkspaceShell project={project.data} setProject={(next) => project.setData(() => next)} />;
}

function WorkspaceShell({ project, setProject }: { project: Project; setProject: (project: Project) => void }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  // The section is the URL segment after the project id. Read from the path (not useParams)
  // so static routes such as settings/general also resolve their section.
  const segments = pathname.split('/');
  const sectionId = segments[segments.indexOf(encodeURIComponent(project.id)) + 1];
  const active = findSection(sectionId);
  const activeItem = active ? findItem(active.section, segments[segments.indexOf(encodeURIComponent(project.id)) + 2]) : null;
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  useWorkspaceShortcuts(project.id, active?.section ?? null);

  // Drawer is open only for the route where it was opened: any navigation closes it.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const drawerOpen = openedAt === pathname;
  const closeDrawer = () => setOpenedAt(null);

  return (
    <WorkspaceContext value={{ project, setProject }}>
      <div className="min-h-dvh lg:flex">
        <SkipLink />

        {/* < lg: top bar + drawer */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-separator bg-background/85 px-2 backdrop-blur-xl lg:hidden">
          <IconButton
            label={t('workspace.openNavigation')}
            icon={<Menu />}
            aria-expanded={drawerOpen}
            aria-controls="workspace-navigation-drawer"
            onPress={() => setOpenedAt(pathname)}
          />
          <p className="min-w-0 truncate text-sm">
            <span className="font-semibold">{project.name}</span>
            {active && <span className="text-muted"> · {t(active.section.titleKey)}</span>}
          </p>
        </header>

        <Drawer.Backdrop isOpen={drawerOpen} onOpenChange={(open) => !open && closeDrawer()} className="lg:hidden">
          <Drawer.Content placement="left" className="w-[min(20rem,88vw)]">
            <Drawer.Dialog id="workspace-navigation-drawer" aria-label={t('workspace.projectNavigation')} className="flex h-full flex-col p-0">
              <Drawer.CloseTrigger aria-label={t('common.a11y.closeNavigation')} />
              <Drawer.Body className="flex flex-1 flex-col overflow-y-auto p-0">
                <PrimaryNav project={project} collapsed={false} onNavigate={closeDrawer} />
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>

        {/* ≥ lg: primary sidebar, expanded or icon rail (user choice) */}
        <div
          id="workspace-sidebar"
          className={cn(
            'sticky top-0 hidden h-dvh shrink-0 border-r border-separator bg-surface transition-[width] duration-200 motion-reduce:transition-none lg:block',
            collapsed ? 'w-[4.5rem]' : 'w-64',
          )}
        >
          <PrimaryNav project={project} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        </div>

        <main id="main-content" className="min-w-0 flex-1">
          <div className="w-full max-w-[90rem] px-4 pb-20 pt-8 md:px-8 lg:px-10 lg:pt-10">
            {active && activeItem && <ItemSwitcher projectId={project.id} section={active.section} />}
            <div key={pathname} data-animate-enter>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </WorkspaceContext>
  );
}
