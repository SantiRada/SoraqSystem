import { useState, type ReactNode } from 'react';
import { Modal } from '@heroui/react';
import { useI18n } from '@/i18n';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Optional: confirmation dialogs may only need title, description and actions. */
  children?: ReactNode;
  /**
   * Action buttons. Place the primary action last. Pass a function to get `requestClose` for
   * Cancel buttons, so they go through the unsaved-changes confirmation too.
   */
  footer?: ReactNode | ((requestClose: () => void) => ReactNode);
  /** Escape and click outside close the dialog (default). Set false only while an action is in progress. */
  isDismissable?: boolean;
  /**
   * The user typed something that would be lost. Closing (Escape, click outside, ×, requestClose)
   * asks for confirmation first instead of discarding it.
   */
  hasUnsavedChanges?: boolean;
  /** 'md' for short tasks; 'lg' for multi-section dialogs. Full screen on small viewports. */
  size?: 'md' | 'lg';
}

/**
 * Modal dialog (HeroUI Modal / React Aria): focus containment, Escape and click outside to close,
 * focus restoration, inert background, aria-labelledby wiring.
 * To focus the first field on open, pass `autoFocus` to that field.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  isDismissable = true,
  hasUnsavedChanges = false,
  size = 'md',
}: DialogProps) {
  const { t } = useI18n();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const requestClose = () => {
    if (hasUnsavedChanges) setConfirmingDiscard(true);
    else onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && requestClose()} isDismissable={isDismissable} isKeyboardDismissDisabled={!isDismissable} variant="blur">
      <Modal.Container size={size} placement="center" scroll="inside">
        <Modal.Dialog className={size === 'lg' ? 'max-h-[90dvh] w-full rounded-3xl sm:max-w-3xl' : 'rounded-3xl'}>
          <Modal.CloseTrigger />
          <Modal.Header className="flex-col items-start gap-1">
            <Modal.Heading className="text-lg font-semibold tracking-tight">{title}</Modal.Heading>
            {description && <p className="text-sm text-muted">{description}</p>}
          </Modal.Header>
          {children && <Modal.Body>{children}</Modal.Body>}
          {footer && (
            <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {typeof footer === 'function' ? footer(requestClose) : footer}
            </Modal.Footer>
          )}

          {/* Nested confirmation: Escape / click outside keep editing (the safe choice). */}
          <Modal.Backdrop isOpen={confirmingDiscard} onOpenChange={(open) => !open && setConfirmingDiscard(false)} isDismissable variant="blur">
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog role="alertdialog" className="rounded-3xl">
                <Modal.Header className="flex-col items-start gap-1">
                  <Modal.Heading className="text-lg font-semibold tracking-tight">{t('common.discard.title')}</Modal.Heading>
                  <p className="text-sm text-muted">{t('common.discard.description')}</p>
                </Modal.Header>
                <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="danger" onPress={() => {
                    setConfirmingDiscard(false);
                    onClose();
                  }}>
                    {t('common.discard.confirm')}
                  </Button>
                  <Button variant="secondary" autoFocus onPress={() => setConfirmingDiscard(false)}>
                    {t('common.discard.keepEditing')}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
