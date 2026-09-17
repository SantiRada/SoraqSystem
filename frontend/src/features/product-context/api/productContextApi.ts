import { apiRequest } from '@/shared/api/httpClient';
import type { ContextPrompt, ProductNote, ProductNoteInput } from '../model/types';

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

export const productContextApi = {
  notes: (projectId: string, signal?: AbortSignal) => apiRequest<ProductNote[]>(`${base(projectId)}/notes`, { signal }),
  createNote: (projectId: string, input: ProductNoteInput) => apiRequest<ProductNote>(`${base(projectId)}/notes`, { method: 'POST', body: input }),
  updateNote: (projectId: string, noteId: string, input: ProductNoteInput) =>
    apiRequest<ProductNote>(`${base(projectId)}/notes/${encodeURIComponent(noteId)}`, { method: 'PATCH', body: input }),
  deleteNote: (projectId: string, noteId: string) => apiRequest<void>(`${base(projectId)}/notes/${encodeURIComponent(noteId)}`, { method: 'DELETE' }),

  contextPrompt: (projectId: string, signal?: AbortSignal) => apiRequest<ContextPrompt>(`${base(projectId)}/context-prompt`, { signal }),
  /** Re-summarises the notes with AI (owner/editor). Slow: seconds, not milliseconds. */
  generateContextPrompt: (projectId: string, signal?: AbortSignal) =>
    apiRequest<ContextPrompt>(`${base(projectId)}/context-prompt`, { method: 'POST', signal }),
};
