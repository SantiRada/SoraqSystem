/**
 * Types shared by every study with participants (Card Sorting, Tree Testing…).
 * Mirrors backend Modules/Studies/StudyFlow and the study tables (docs/decisions/0016).
 */

export interface RichMark {
  type: 'bold' | 'italic' | 'typography';
  attrs?: { font?: RichFont; size?: RichSize; weight?: RichWeight };
}
export interface RichNode {
  type: 'doc' | 'paragraph' | 'heading' | 'text' | 'bulletList' | 'orderedList' | 'listItem' | 'horizontalRule' | 'hardBreak';
  attrs?: { level?: number; start?: number };
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
}
export type RichDoc = RichNode & { type: 'doc' };
export type RichFont = 'sans' | 'serif' | 'mono';
export type RichSize = 'sm' | 'lg' | 'xl';
export type RichWeight = 'medium' | 'semibold';

export type StudyStatus = 'draft' | 'active' | 'paused' | 'closed';
export type StudyAccessRole = 'owner' | 'editor' | 'viewer' | 'shared_viewer';
export type StatusAction = 'publish' | 'pause' | 'resume' | 'close';
export type QuestionType = 'stars' | 'scale' | 'text' | 'radio' | 'checkbox';

export interface Message {
  title: string;
  body: RichDoc;
}
export interface ScreeningOption {
  id: string;
  label: string;
  qualifies: boolean;
}
export interface ScreeningQuestion {
  id: string;
  prompt: string;
  options: ScreeningOption[];
}
export interface InstructionStep extends Message {
  id: string;
}
export interface PostQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  required: boolean;
  options: { id: string; label: string }[];
  scaleMax: number | null;
  /** Text questions: hint shown inside the answer box. */
  placeholder?: string | null;
}
export interface Flow {
  welcome: Message;
  context: Message & { enabled: boolean };
  screening: { enabled: boolean; questions: ScreeningQuestion[]; rejection: Message };
  instructions: InstructionStep[];
  postStudy: { enabled: boolean; questions: PostQuestion[] };
  thanks: Message;
  closed: Message;
}

export const SOCIAL_NETWORKS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'github', 'reddit', 'facebook', 'x', 'threads', 'discord', 'pinterest', 'whatsapp', 'twitch', 'kick'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface StudySettings {
  continueLabel: string;
  finishLabel: string;
  accentColor: string | null;
  socialLinks: Partial<Record<SocialNetwork, string>>;
}

export interface StudyViewer {
  id: string;
  displayName: string;
  email: string;
  addedAt: string | null;
}

/** Server validation errors by field path ("cards.2.label"). */
export type FieldErrors = Record<string, string>;

/** What every study dashboard needs from its study, whatever its activity is. */
export interface BaseStudy {
  id: string;
  name: string;
  status: StudyStatus;
  responseCount: number;
  project: { id: string; name: string };
  accessRole: StudyAccessRole;
  updatedAt: string;
  publicPath: string | null;
  permissions: { canEdit: boolean; canManageSharing: boolean };
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  settings: StudySettings;
  flow: Flow;
}

/** The look & feel a participant receives. */
export interface PublicSettings {
  continueLabel: string;
  finishLabel: string;
  accentColor: string | null;
  socialLinks: Partial<Record<SocialNetwork, string>>;
}
export interface Landing {
  status: 'active' | 'paused' | 'closed';
  welcome: Message | null;
  closed: Message | null;
  settings: PublicSettings;
}
/** Flow the participant goes through (screening rules stay on the server). */
export interface ParticipantFlow {
  welcome: Message;
  context: Message | null;
  screening: { id: string; prompt: string; options: { id: string; label: string }[] }[];
  instructions: InstructionStep[];
  postStudy: PostQuestion[];
  thanks: Message;
}
export type PostAnswer = number | string | string[];

/** Answers and questions frozen with each response. */
export interface ResponseQuestions {
  screeningQuestions: ScreeningQuestion[];
  postQuestions: PostQuestion[];
}
export interface BaseResponse {
  number: number;
  status: 'completed' | 'screened_out';
  screeningAnswers: Record<string, string>;
  postAnswers: Record<string, PostAnswer>;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
}

/** API shape every study module exposes for the shared dashboard panels. */
export interface StudyApi<TStudy> {
  save: (studyId: string, document: never) => Promise<TStudy>;
  changeStatus: (studyId: string, action: StatusAction) => Promise<TStudy>;
  remove: (studyId: string, confirmName: string) => Promise<void>;
  deleteResponses: (studyId: string, confirmName: string) => Promise<void>;
  viewers: (studyId: string, signal?: AbortSignal) => Promise<StudyViewer[]>;
  addViewer: (studyId: string, email: string) => Promise<StudyViewer[]>;
  removeViewer: (studyId: string, userId: string) => Promise<void>;
}

/** Must match the backend limits (Modules/Studies/StudyFlow). */
export const LIMITS = {
  name: 120,
  placeholder: 120,
  questions: 20,
  options: 10,
  steps: 10,
  label: 120,
  title: 160,
  categoryLabel: 80,
  textAnswer: 2000,
  socialUrl: 300,
  buttonLabel: 40,
} as const;
