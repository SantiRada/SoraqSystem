/** Mirrors backend ProductNoteRepository::toPublicArray(). */
export interface ProductNote {
  id: string;
  title: string;
  body: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductNoteInput {
  title: string;
  body: string;
}

/** Mirrors backend ContextPromptService::show(). */
export interface ContextPrompt {
  summary: string | null;
  generatedAt: string | null;
  model: string | null;
  noteCount: number;
  summarizedNoteCount: number;
  /** Notes changed since the stored summary (or there is no summary yet). */
  isStale: boolean;
  /** An AI provider key exists on the server. */
  aiConfigured: boolean;
}

/** Must match backend ProductNoteService. */
export const NOTE_TITLE_MAX = 120;
export const NOTE_BODY_MAX = 5000;
