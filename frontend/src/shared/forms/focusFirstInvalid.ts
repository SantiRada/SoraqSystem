/**
 * Moves focus to the first invalid control (or a form-level alert) after errors render.
 * Error prevention & recovery: the user lands exactly where action is needed.
 *
 * setTimeout (not requestAnimationFrame): runs after React commits the error state,
 * and still runs in background tabs where animation frames are paused.
 */
export function focusFirstInvalid(form: HTMLFormElement | null): void {
  setTimeout(() => {
    const target = form?.querySelector<HTMLElement>('[data-form-error], [aria-invalid="true"]');
    target?.focus();
  }, 0);
}
