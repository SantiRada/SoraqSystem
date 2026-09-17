import { useEffect, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  /** Accessible name of the drag handle for an item (e.g. "Reordenar Inicio"). */
  handleLabel: (item: T, index: number) => string;
  /** Announcement after a keyboard move. */
  movedMessage: (item: T, position: number) => string;
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  isDisabled?: boolean;
  className?: string;
  itemClassName?: string;
}

/**
 * Vertical list reordered by drag and drop from a grip handle on the left of each item.
 * - Pointer: press the handle and drag; a line shows where the item will land.
 * - Keyboard: focus the handle and use Arrow Up / Arrow Down; the new position is announced.
 * Only the handle starts a drag, so text inside inputs stays selectable.
 */
export function SortableList<T extends { id: string }>({ items, onReorder, handleLabel, movedMessage, renderItem, isDisabled, className, itemClassName }: SortableListProps<T>) {
  const [armedId, setArmedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [target, setTarget] = useState<{ index: number; after: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!armedId) return;
    const disarm = () => setArmedId((current) => (draggingId ? current : null));
    window.addEventListener('pointerup', disarm);
    return () => window.removeEventListener('pointerup', disarm);
  }, [armedId, draggingId]);

  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onReorder(next);
    setAnnouncement(movedMessage(item, to + 1));
  };

  const onDragOver = (event: DragEvent<HTMLLIElement>, index: number) => {
    if (!draggingId) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setTarget({ index, after: event.clientY > rect.top + rect.height / 2 });
  };

  const onDrop = (event: DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    const from = items.findIndex((i) => i.id === draggingId);
    if (from >= 0 && target) {
      let to = target.index + (target.after ? 1 : 0);
      if (from < to) to -= 1;
      moveTo(from, to);
    }
    endDrag();
  };

  const endDrag = () => {
    setDraggingId(null);
    setArmedId(null);
    setTarget(null);
  };

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ol className={cn('grid list-none gap-2 p-0', className)}>
        {items.map((item, index) => {
          const handle = isDisabled ? null : (
            <button
              type="button"
              aria-label={handleLabel(item, index)}
              onPointerDown={() => setArmedId(item.id)}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveTo(index, index + (event.key === 'ArrowUp' ? -1 : 1));
                  const button = event.currentTarget as HTMLButtonElement;
                  setTimeout(() => button.focus(), 0);
                }
              }}
              className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted transition-colors hover:bg-default-soft hover:text-foreground active:cursor-grabbing"
            >
              <GripVertical aria-hidden="true" className="size-4" />
            </button>
          );

          return (
            // Drag events are the pointer path; the handle button provides the keyboard equivalent.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <li
              key={item.id}
              draggable={armedId === item.id}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', item.id);
                setDraggingId(item.id);
              }}
              onDragEnd={endDrag}
              onDragOver={(event) => onDragOver(event, index)}
              onDrop={onDrop}
              className={cn(
                'relative transition-opacity duration-200',
                draggingId === item.id && 'opacity-40',
                itemClassName,
              )}
            >
              {target?.index === index && draggingId && draggingId !== item.id && (
                <span aria-hidden="true" className={cn('pointer-events-none absolute inset-x-2 z-10 h-0.5 rounded-full bg-accent', target.after ? '-bottom-1.5' : '-top-1.5')} />
              )}
              {renderItem(item, index, handle)}
            </li>
          );
        })}
      </ol>
    </>
  );
}
