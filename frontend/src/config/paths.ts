/**
 * Single source of truth for URLs. Never hard-code a path string in a component:
 * renaming a route must be a one-file change.
 */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  app: '/app',
  projects: '/app/projects',
  project: (projectId: string) => `/app/projects/${encodeURIComponent(projectId)}`,
  projectSection: (projectId: string, sectionId: string) => `/app/projects/${encodeURIComponent(projectId)}/${sectionId}`,
  projectItem: (projectId: string, sectionId: string, itemId: string) =>
    `/app/projects/${encodeURIComponent(projectId)}/${sectionId}/${itemId}`,
  cardSortStudy: (projectId: string, studyId: string) => `/app/projects/${encodeURIComponent(projectId)}/navigation/card-sorting/${encodeURIComponent(studyId)}`,
  sharedCardSort: (studyId: string) => `/app/shared/card-sorting/${encodeURIComponent(studyId)}`,
  account: (tab: AccountTab = 'profile') => `/app/account/${tab}`,
  projectSettings: (projectId: string, tab: ProjectSettingsTab = 'general') => `/app/projects/${encodeURIComponent(projectId)}/settings/${tab}`,
} as const;

export type ProjectSettingsTab = 'general' | 'access' | 'delete';
export type AccountTab = 'profile' | 'billing' | 'session' | 'preferences';

/** Only internal app paths are valid post-login destinations (prevents open redirects). */
export function isSafeRedirect(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/app') && !path.startsWith('//');
}
