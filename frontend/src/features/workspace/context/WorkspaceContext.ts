import { createContext, useContext } from 'react';
import type { Project } from '@/features/projects';

interface WorkspaceContextValue {
  /** The project currently open. Loaded once by ProjectWorkspaceLayout (backend-authorised). */
  project: Project;
  /** Replace the loaded project after a successful update (keeps sidebars in sync). */
  setProject: (project: Project) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** Project context for every page and module mounted inside the workspace. */
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside ProjectWorkspaceLayout.');
  return context;
}
