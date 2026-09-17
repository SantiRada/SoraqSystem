import { siDiscord, siFacebook, siGithub, siInstagram, siKick, siPinterest, siReddit, siThreads, siTiktok, siTwitch, siWhatsapp, siX, siYoutube } from 'simple-icons';
import type { SocialNetwork } from '../model/types';

/** Short random id for items inside a study document (cards, questions…). Matches backend Payload::id. */
export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

// Simple Icons (CC0). LinkedIn is not distributed by Simple Icons, so its glyph is declared here.
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const socialPaths: Record<SocialNetwork, string> = {
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  linkedin: LINKEDIN_PATH,
  github: siGithub.path,
  reddit: siReddit.path,
  facebook: siFacebook.path,
  x: siX.path,
  threads: siThreads.path,
  discord: siDiscord.path,
  pinterest: siPinterest.path,
  whatsapp: siWhatsapp.path,
  twitch: siTwitch.path,
  kick: siKick.path,
};

/** Monochrome brand glyph (inherits currentColor so it adapts to both themes). */
export function SocialIcon({ network, className }: { network: SocialNetwork; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className ?? 'size-5'} fill="currentColor">
      <path d={socialPaths[network]} />
    </svg>
  );
}

/** Readable foreground (white or near-black) for text on an arbitrary accent colour (WCAG contrast). */
export function readableForeground(hex: string): string {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  const contrastWhite = 1.05 / (luminance + 0.05);
  const contrastDark = (luminance + 0.05) / (0.0137 + 0.05);
  return contrastWhite >= contrastDark ? '#ffffff' : '#0b0b0f';
}

/** Default Soraq accent used as the colour picker's starting value. */
export const SORAQ_ACCENT = '#376ceb';
export const ACCENT_PRESETS = ['#376ceb', '#7c5cff', '#0891b2', '#059669', '#65a30d', '#d97706', '#dc2626', '#db2777', '#9333ea', '#0f172a'];
