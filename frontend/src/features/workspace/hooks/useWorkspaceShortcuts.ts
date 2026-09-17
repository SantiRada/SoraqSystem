import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/config/paths';
import { projectNavigation, sectionItems, type WorkspaceSection } from '../config/projectNavigation';

/** Level 2 sections in sidebar order. Digits 1–9 map to the first nine, 0 to the tenth. */
export const shortcutSections: WorkspaceSection[] = projectNavigation.flatMap((group) => group.sections);

/** "1".."9","0" for positions 0..9; null beyond (no shortcut). */
export function shortcutDigit(index: number): string | null {
  if (index < 0 || index > 9) return null;
  return index === 9 ? '0' : String(index + 1);
}

function digitIndex(code: string): number | null {
  const match = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (!match) return null;
  return match[1] === '0' ? 9 : Number(match[1]) - 1;
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/**
 * Keyboard shortcuts inside a project:
 *  - Ctrl+{n} (alias Alt+{n}): go to the n-th level 2 section.
 *  - Shift+{n}: go to the n-th level 3 item of the open section.
 * Uses `event.code`, so it works on any keyboard layout (Shift+1 types "!" but is still Digit1).
 * Ignored while a dialog, drawer or menu is open, and Shift/Alt variants are ignored while typing.
 * Ctrl+AltGr combinations are ignored (AltGr+digit types symbols such as @ on Spanish layouts).
 */
export function useWorkspaceShortcuts(projectId: string, activeSection: WorkspaceSection | null) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey) return;
      const index = digitIndex(event.code);
      if (index === null) return;

      const sectionShortcut = event.ctrlKey !== event.altKey && !event.shiftKey;
      const itemShortcut = event.shiftKey && !event.ctrlKey && !event.altKey;
      if (!sectionShortcut && !itemShortcut) return;
      if ((itemShortcut || event.altKey) && isEditable(event.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;

      if (sectionShortcut) {
        const section = shortcutSections[index];
        if (!section) return;
        event.preventDefault();
        navigate(paths.projectSection(projectId, section.id));
        return;
      }

      const item = activeSection ? sectionItems(activeSection)[index] : undefined;
      if (!activeSection || !item) return;
      event.preventDefault();
      navigate(paths.projectItem(projectId, activeSection.id, item.id));
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, projectId, activeSection]);
}
