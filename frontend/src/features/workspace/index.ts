/** Public API of the project workspace feature. Future modules use useWorkspace() for project context. */
export { workspaceRoutes } from './routes';
export { useWorkspace } from './context/WorkspaceContext';
export { projectNavigation, findSection, findItem, sectionItems } from './config/projectNavigation';
export type { WorkspaceGroup, WorkspaceSection, WorkspaceItem, WorkspaceSubgroup } from './config/projectNavigation';
