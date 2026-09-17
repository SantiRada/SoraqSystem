/** Mirrors backend CardSortContent / CardSort::toDetailArray (docs/modules/card-sorting.md). */

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

export type SortType = 'open' | 'hybrid' | 'closed';
export type StudyStatus = 'draft' | 'active' | 'paused' | 'closed';
export type StudyAccessRole = 'owner' | 'editor' | 'viewer' | 'shared_viewer';
export type QuestionType = 'stars' | 'scale' | 'text' | 'radio' | 'checkbox';

export interface Card {
  id: string;
  label: string;
  description: RichDoc | null;
}
export interface Category {
  id: string;
  label: string;
}
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

export interface StudySummary {
  id: string;
  name: string;
  status: StudyStatus;
  sortType: SortType;
  cardCount: number;
  responseCount: number;
  project: { id: string; name: string };
  accessRole: StudyAccessRole;
  updatedAt: string;
}

/** The part of a study the designer edits (PATCH body). */
export interface StudyDocument {
  name: string;
  sortType: SortType;
  purpose: RichDoc;
  participantRequirements: RichDoc;
  cardsHaveDescriptions: boolean;
  /** Each participant sees cards / categories in a different random order. */
  randomizeCards: boolean;
  randomizeCategories: boolean;
  cards: Card[];
  categories: Category[];
  flow: Flow;
  settings: StudySettings;
}

export interface Study extends StudySummary, StudyDocument {
  publicPath: string | null;
  permissions: { canEdit: boolean; canManageSharing: boolean };
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export type StatusAction = 'publish' | 'pause' | 'resume' | 'close';

export interface StudyViewer {
  id: string;
  displayName: string;
  email: string;
  addedAt: string | null;
}

// ── Report ────────────────────────────────────────────────────────────────

export interface ResponseSnapshot {
  sortType: SortType;
  cards: { id: string; label: string }[];
  categories: Category[];
  screeningQuestions: ScreeningQuestion[];
  postQuestions: PostQuestion[];
}
export interface SortedCategory {
  label: string;
  predefinedId: string | null;
  cardIds: string[];
}
export type PostAnswer = number | string | string[];
export interface StudyResponse {
  number: number;
  status: 'completed' | 'screened_out';
  snapshot: ResponseSnapshot;
  screeningAnswers: Record<string, string>;
  postAnswers: Record<string, PostAnswer>;
  categories: SortedCategory[];
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
}
export interface StudyReport {
  responses: StudyResponse[];
  inProgressCount: number;
}

// ── Participant ───────────────────────────────────────────────────────────

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
export interface ParticipantSession {
  token: string;
  sortType: SortType;
  cards: Card[];
  categories: Category[];
  flow: {
    welcome: Message;
    context: Message | null;
    screening: { id: string; prompt: string; options: { id: string; label: string }[] }[];
    instructions: InstructionStep[];
    postStudy: PostQuestion[];
    thanks: Message;
  };
  settings: PublicSettings;
}

/** Must match backend CardSortContent limits. */
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
