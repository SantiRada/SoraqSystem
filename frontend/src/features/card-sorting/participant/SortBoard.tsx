import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';
import { Dropdown } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { LIMITS, type Card, type Category, type SortType } from '../model/types';
import { RichTextView } from '../rich-text/RichTextView';
import { newId } from '../components/shared';

export interface BoardGroup {
  key: string;
  label: string;
  predefinedId: string | null;
  cardIds: string[];
}

interface SortBoardProps {
  sortType: SortType;
  cards: Card[];
  groups: BoardGroup[];
  onChange: (groups: BoardGroup[]) => void;
  /** false while instructions are shown: the card list is visible but not movable yet. */
  interactive: boolean;
  /** Shown in the canvas instead of the groups (instructions). */
  canvasContent?: ReactNode;
  /** Fixed top-right bar (progress + continue). */
  header?: ReactNode;
  /** Bottom of the card sidebar (e.g. "Hecho con Soraq"). */
  sidebarFooter?: ReactNode;
}

const UNSORTED = '__unsorted__';
const NEW_GROUP = '__new__';
const MAX_GROUPS = 300;

export function initialGroups(sortType: SortType, categories: Category[]): BoardGroup[] {
  return sortType === 'open' ? [] : categories.map((c) => ({ key: c.id, label: c.label, predefinedId: c.id, cardIds: [] }));
}

/**
 * The card sorting activity as a full-screen workspace:
 * - Left: the cards to sort, docked to the edge of the screen like a sidebar.
 * - Canvas: groups. Dropping a card on empty canvas creates a new group (open / hybrid sorts).
 * - Every card also has a "Mover a" menu (keyboard, touch, screen readers); moves are announced.
 * Groups created by participants are renamed in place and disappear when they become empty.
 */
export function SortBoard({ sortType, cards, groups, onChange, interactive, canvasContent, header, sidebarFooter }: SortBoardProps) {
  const { t } = useI18n();
  const [announcement, setAnnouncement] = useState('');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const canCreate = sortType !== 'closed';
  const byId = new Map(cards.map((c) => [c.id, c]));
  const sorted = new Set(groups.flatMap((g) => g.cardIds));
  const unsorted = cards.filter((c) => !sorted.has(c.id));
  const groupName = (g: BoardGroup) => g.label.trim() || t('cardSorting.participant.board.unnamed');

  const moveCard = (cardId: string, target: string) => {
    const card = byId.get(cardId);
    if (!card || !interactive) return;
    let next = groups.map((g) => ({ ...g, cardIds: g.cardIds.filter((id) => id !== cardId) }));
    let targetName = t('cardSorting.participant.board.moveToUnsorted');
    if (target === NEW_GROUP) {
      if (!canCreate || groups.length >= MAX_GROUPS) return;
      const group: BoardGroup = { key: newId(), label: '', predefinedId: null, cardIds: [cardId] };
      next = [...next, group];
      targetName = t('cardSorting.participant.board.moveToNew');
      setEditingKey(group.key);
    } else if (target !== UNSORTED) {
      next = next.map((g) => (g.key === target ? { ...g, cardIds: [...g.cardIds, cardId] } : g));
      const group = next.find((g) => g.key === target);
      if (group) targetName = groupName(group);
    }
    // Groups created by the participant only exist while they hold cards.
    onChange(next.filter((g) => g.predefinedId !== null || g.cardIds.length > 0));
    setAnnouncement(t('cardSorting.participant.board.moved', { card: card.label, group: targetName }));
  };

  const dropProps = (target: string) => ({
    onDragOver: (event: DragEvent) => {
      if (!interactive) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOver(target);
    },
    onDragLeave: (event: DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setDragOver((current) => (current === target ? null : current));
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(null);
      const cardId = event.dataTransfer.getData('text/plain');
      if (cardId) moveCard(cardId, target);
    },
  });

  const renderCard = (card: Card, current: string) => (
    <li key={card.id}>
      {/* Drag is a pointer shortcut; the "Mover a" menu is the keyboard / touch / screen reader equivalent. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        draggable={interactive}
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', card.id);
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setDragOver(null)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-2 shadow-sm transition-shadow',
          interactive ? 'cursor-grab hover:shadow-md active:cursor-grabbing' : 'opacity-90',
        )}
      >
        <GripVertical aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug [overflow-wrap:anywhere]">{card.label}</p>
          {card.description && <RichTextView doc={card.description} className="mt-0.5 gap-1 text-xs text-muted" />}
        </div>
        {interactive && (
          <Dropdown>
            <Dropdown.Trigger
              aria-label={t('cardSorting.participant.board.moveTo', { card: card.label })}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-default-soft hover:text-foreground"
            >
              <ChevronDown aria-hidden="true" className="size-4" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="min-w-52">
              <Dropdown.Menu aria-label={t('cardSorting.participant.board.moveToLabel')} onAction={(key) => moveCard(card.id, String(key))}>
                {[
                  ...groups.filter((g) => g.key !== current).map((g) => ({ id: g.key, label: groupName(g) })),
                  ...(canCreate ? [{ id: NEW_GROUP, label: t('cardSorting.participant.board.moveToNew') }] : []),
                  ...(current !== UNSORTED ? [{ id: UNSORTED, label: t('cardSorting.participant.board.moveToUnsorted') }] : []),
                ].map((item) => (
                  <Dropdown.Item key={item.id} id={item.id} textValue={item.label}>
                    {item.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        )}
      </div>
    </li>
  );

  return (
    <div className="min-h-dvh lg:flex">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {header && <div className="fixed right-3 top-3 z-[120] md:right-5 md:top-5">{header}</div>}

      <aside
        aria-labelledby="unsorted-heading"
        {...dropProps(UNSORTED)}
        className={cn(
          'flex max-h-[45dvh] flex-col border-b border-separator bg-surface transition-colors lg:fixed lg:inset-y-0 lg:left-0 lg:max-h-none lg:w-80 lg:border-b-0 lg:border-r',
          dragOver === UNSORTED && 'bg-accent/5',
        )}
      >
        <header className="border-b border-separator px-4 py-4">
          <h2 id="unsorted-heading" className="text-sm font-semibold">
            {t('cardSorting.participant.board.unsorted')}
          </h2>
          <p className="text-xs text-muted">
            {unsorted.length ? t('cardSorting.participant.board.unsortedCount', { count: unsorted.length }) : t('cardSorting.participant.board.allSorted')}
          </p>
        </header>
        <ul className="grid flex-1 list-none content-start gap-2 overflow-y-auto p-3">{unsorted.map((card) => renderCard(card, UNSORTED))}</ul>
        {sidebarFooter && <div className="border-t border-separator px-4 py-3">{sidebarFooter}</div>}
      </aside>

      <section
        aria-label={t('cardSorting.participant.board.canvasLabel')}
        {...(canCreate && !canvasContent ? dropProps(NEW_GROUP) : {})}
        className={cn(
          'relative min-h-[60dvh] flex-1 px-4 pb-16 pt-24 transition-colors md:px-8 lg:ml-80 lg:min-h-dvh',
          dragOver === NEW_GROUP && 'bg-accent/5 outline-2 -outline-offset-8 outline-dashed outline-accent/50',
        )}
      >
        {canvasContent ? (
          <div className="mx-auto grid max-w-2xl gap-6 pt-[4dvh]">{canvasContent}</div>
        ) : (
          <>
            {groups.length === 0 && canCreate && (
              <p className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">{t('cardSorting.participant.board.dropNew')}</p>
            )}
            <h2 className="sr-only">{t('cardSorting.participant.board.groups')}</h2>
            <ul className="grid list-none content-start gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {groups.map((group) => (
                <li
                  key={group.key}
                  {...dropProps(group.key)}
                  className={cn('grid content-start gap-3 rounded-lg border bg-surface-secondary/60 p-3 transition-colors', dragOver === group.key ? 'border-accent bg-accent/5' : 'border-border')}
                >
                  {group.predefinedId ? (
                    <h3 className="px-1 text-sm font-semibold [overflow-wrap:anywhere]">{group.label}</h3>
                  ) : (
                    <GroupName
                      label={group.label}
                      isEditing={editingKey === group.key}
                      onEdit={() => setEditingKey(group.key)}
                      onDone={() => setEditingKey(null)}
                      onChange={(label) => onChange(groups.map((g) => (g.key === group.key ? { ...g, label } : g)))}
                    />
                  )}
                  {group.cardIds.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">{t('cardSorting.participant.board.emptyGroup')}</p>
                  ) : (
                    <ul className="grid list-none gap-2 p-0">{group.cardIds.map((id) => byId.get(id)).filter((c): c is Card => Boolean(c)).map((card) => renderCard(card, group.key))}</ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

/** Group name edited in place: an underlined label that turns into a borderless text box with the same look. */
function GroupName({ label, isEditing, onEdit, onDone, onChange }: { label: string; isEditing: boolean; onEdit: () => void; onDone: () => void; onChange: (label: string) => void }) {
  const { t } = useI18n();
  const placeholder = t('cardSorting.participant.board.groupNamePlaceholder');
  const text = 'block w-full px-1 py-0.5 text-left text-sm font-semibold underline underline-offset-4';
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (isEditing) {
    return (
      <input
        // Focus goes straight to the name the participant just created or clicked.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        aria-label={t('cardSorting.participant.board.groupName')}
        maxLength={LIMITS.categoryLabel}
        value={label}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          onChange(label.trim());
          onDone();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.currentTarget.blur();
            // Keyboard users stay on the name they just edited.
            setTimeout(() => buttonRef.current?.focus(), 0);
          }
        }}
        className={cn(text, 'rounded-md bg-transparent decoration-accent outline-none placeholder:text-muted')}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onEdit}
      aria-label={t('cardSorting.participant.board.renameGroup', { name: label || placeholder })}
      className={cn(
        text,
        'rounded-md outline-none transition-colors hover:bg-default-soft focus-visible:outline-2 focus-visible:outline-focus [overflow-wrap:anywhere]',
        label ? 'text-foreground decoration-foreground/40' : 'font-medium text-muted decoration-dashed decoration-muted',
      )}
    >
      {label || placeholder}
    </button>
  );
}
