import { apiRequest } from '@/shared/api/httpClient';
import type {
  Landing,
  ParticipantSession,
  PostAnswer,
  StatusAction,
  Study,
  StudyDocument,
  StudyReport,
  StudySummary,
  StudyViewer,
} from '../model/types';

const study = (studyId: string) => `/card-sorts/${encodeURIComponent(studyId)}`;
const publicStudy = (code: string) => `/public/card-sorts/${encodeURIComponent(code)}`;

export const cardSortingApi = {
  list: (projectId: string, signal?: AbortSignal) => apiRequest<StudySummary[]>(`/projects/${encodeURIComponent(projectId)}/card-sorts`, { signal }),
  create: (projectId: string, name: string) => apiRequest<Study>(`/projects/${encodeURIComponent(projectId)}/card-sorts`, { method: 'POST', body: { name } }),
  shared: (signal?: AbortSignal) => apiRequest<StudySummary[]>('/card-sorts/shared', { signal }),
  get: (studyId: string, signal?: AbortSignal) => apiRequest<Study>(study(studyId), { signal }),
  save: (studyId: string, document: StudyDocument) => apiRequest<Study>(study(studyId), { method: 'PATCH', body: document }),
  changeStatus: (studyId: string, action: StatusAction) => apiRequest<Study>(`${study(studyId)}/status`, { method: 'POST', body: { action } }),
  remove: (studyId: string, confirmName: string) => apiRequest<void>(study(studyId), { method: 'DELETE', body: { confirmName } }),
  report: (studyId: string, signal?: AbortSignal) => apiRequest<StudyReport>(`${study(studyId)}/report`, { signal }),
  deleteResponses: (studyId: string, confirmName: string) => apiRequest<void>(`${study(studyId)}/responses`, { method: 'DELETE', body: { confirmName } }),
  viewers: (studyId: string, signal?: AbortSignal) => apiRequest<StudyViewer[]>(`${study(studyId)}/viewers`, { signal }),
  addViewer: (studyId: string, email: string) => apiRequest<StudyViewer[]>(`${study(studyId)}/viewers`, { method: 'POST', body: { email } }),
  removeViewer: (studyId: string, userId: string) => apiRequest<void>(`${study(studyId)}/viewers/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
};

/** Anonymous participant endpoints (shared link). */
export const participantApi = {
  landing: (code: string, signal?: AbortSignal) => apiRequest<Landing>(publicStudy(code), { signal }),
  start: (code: string) => apiRequest<ParticipantSession>(`${publicStudy(code)}/responses`, { method: 'POST', body: {} }),
  screening: (code: string, token: string, answers: Record<string, string>) =>
    apiRequest<{ result: 'continue' } | { result: 'screened_out'; rejection: { title: string; body: ParticipantSession['flow']['thanks']['body'] } | null }>(
      `${publicStudy(code)}/screening`,
      { method: 'POST', body: { token, answers } },
    ),
  complete: (
    code: string,
    token: string,
    categories: { label?: string; predefinedId?: string; cardIds: string[] }[],
    postAnswers: Record<string, PostAnswer>,
  ) => apiRequest<{ result: 'completed' }>(`${publicStudy(code)}/complete`, { method: 'POST', body: { token, categories, postAnswers } }),
};
