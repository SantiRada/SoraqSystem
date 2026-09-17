import { apiRequest } from '@/shared/api/httpClient';
import type { CreateProjectInput, MemberRole, Project, ProjectDetailsInput, ProjectMember } from '../model/types';

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

export const projectsApi = {
  list: (signal?: AbortSignal) => apiRequest<Project[]>('/projects', { signal }),
  get: (projectId: string, signal?: AbortSignal) => apiRequest<Project>(base(projectId), { signal }),
  create: (input: CreateProjectInput) => apiRequest<Project>('/projects', { method: 'POST', body: input }),
  update: (projectId: string, input: ProjectDetailsInput) => apiRequest<Project>(base(projectId), { method: 'PATCH', body: input }),
  /** The exact project name is required by the server as confirmation. */
  remove: (projectId: string, confirmName: string) => apiRequest<void>(base(projectId), { method: 'DELETE', body: { confirmName } }),

  members: (projectId: string, signal?: AbortSignal) => apiRequest<ProjectMember[]>(`${base(projectId)}/members`, { signal }),
  addMember: (projectId: string, email: string, role: MemberRole) =>
    apiRequest<ProjectMember[]>(`${base(projectId)}/members`, { method: 'POST', body: { email, role } }),
  updateMemberRole: (projectId: string, userId: string, role: MemberRole) =>
    apiRequest<ProjectMember[]>(`${base(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'PATCH', body: { role } }),
  /** Owner removes a member, or a member removes themselves (leave). */
  removeMember: (projectId: string, userId: string) =>
    apiRequest<void>(`${base(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
};
