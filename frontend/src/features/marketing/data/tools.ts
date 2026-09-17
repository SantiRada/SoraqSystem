/**
 * Tools shown in the home marquee. Names only (no third-party logos/trademarks as images).
 * These are tools Soraq guides you to use, NOT official integrations (see copy disclaimer).
 */
export type ToolCategory = 'design' | 'ai' | 'research' | 'docs' | 'testing' | 'build' | 'whiteboard' | 'management' | 'web';

export interface Tool {
  name: string;
  category: ToolCategory;
  /** Tailwind gradient classes for the monogram tile (decorative). */
  tint: string;
}

export const toolRows: Tool[][] = [
  [
    { name: 'Figma', category: 'design', tint: 'from-violet-500 to-fuchsia-500' },
    { name: 'Claude', category: 'ai', tint: 'from-orange-400 to-amber-600' },
    { name: 'ChatGPT', category: 'ai', tint: 'from-emerald-400 to-teal-600' },
    { name: 'Gemini', category: 'ai', tint: 'from-sky-400 to-indigo-600' },
    { name: 'Perplexity', category: 'research', tint: 'from-cyan-400 to-teal-600' },
    { name: 'Notion', category: 'docs', tint: 'from-zinc-300 to-zinc-500' },
    { name: 'Maze', category: 'testing', tint: 'from-blue-400 to-blue-700' },
    { name: 'Dovetail', category: 'research', tint: 'from-purple-400 to-indigo-600' },
    { name: 'Linear', category: 'management', tint: 'from-indigo-400 to-violet-600' },
  ],
  [
    { name: 'FigJam', category: 'whiteboard', tint: 'from-pink-400 to-rose-600' },
    { name: 'Miro', category: 'whiteboard', tint: 'from-yellow-300 to-amber-500' },
    { name: 'Cursor', category: 'build', tint: 'from-zinc-400 to-zinc-700' },
    { name: 'Lovable', category: 'build', tint: 'from-rose-400 to-orange-500' },
    { name: 'Framer', category: 'web', tint: 'from-blue-500 to-cyan-400' },
    { name: 'Webflow', category: 'web', tint: 'from-blue-500 to-indigo-700' },
    { name: 'Lyssna', category: 'testing', tint: 'from-lime-400 to-emerald-600' },
    { name: 'Jira', category: 'management', tint: 'from-blue-400 to-sky-600' },
    { name: 'Google Docs', category: 'docs', tint: 'from-blue-400 to-blue-600' },
  ],
];
