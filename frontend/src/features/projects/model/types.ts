/** The CURRENT user's role on a project (backend ProjectPolicy). */
export type ProjectRole = 'owner' | 'editor' | 'viewer';
export type MemberRole = Exclude<ProjectRole, 'owner'>;

/** Mirrors backend Project::toPublicArray(). */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  accessRole: ProjectRole;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailsInput {
  name: string;
  description: string | null;
}

export type CreateProjectInput = ProjectDetailsInput;

/** Mirrors backend ProjectMemberRepository::listForProject(). */
export interface ProjectMember {
  id: string;
  displayName: string;
  email: string;
  role: ProjectRole;
  addedAt: string | null;
}

/** Client-side mirror of ProjectPolicy (UX only — the API enforces it). */
export const projectPermissions = {
  canUpdate: (role: ProjectRole) => role === 'owner' || role === 'editor',
  canManageMembers: (role: ProjectRole) => role === 'owner',
  canDelete: (role: ProjectRole) => role === 'owner',
  canLeave: (role: ProjectRole) => role !== 'owner',
};

/** Must match backend ProjectService validation. */
export const PROJECT_NAME_MAX = 120;
export const PROJECT_DESCRIPTION_MAX = 2000;
