import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const HEADING_SELECTOR = '[data-page-heading]';
const MAX_WAIT_MS = 5000;

/**
 * After client-side navigation, move focus to the new page's <h1>
 * (marked with data-page-heading). Screen readers then announce the new page,
 * and keyboard users continue from the top of the content.
 *
 * Pages that load data render their heading later, so we wait for it
 * (MutationObserver, capped). The initial page load is left alone.
 */
export function useRouteFocus(): void {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const focusHeading = (): boolean => {
      const heading = document.querySelector<HTMLElement>(HEADING_SELECTOR);
      if (!heading) return false;
      heading.focus({ preventScroll: true });
      return true;
    };

    let observer: MutationObserver | undefined;
    const timer = setTimeout(() => {
      if (focusHeading()) return;
      observer = new MutationObserver(() => {
        if (focusHeading()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }, 0);
    const giveUp = setTimeout(() => observer?.disconnect(), MAX_WAIT_MS);

    return () => {
      clearTimeout(timer);
      clearTimeout(giveUp);
      observer?.disconnect();
    };
  }, [pathname]);
}
