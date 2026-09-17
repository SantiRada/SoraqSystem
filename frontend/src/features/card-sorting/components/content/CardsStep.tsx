import { startTransition, useState, type FocusEvent } from 'react';
import { ListPlus, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Dialog, IconButton, Reveal, SwitchField, TextAreaField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { LIMITS, type Card as StudyCard } from '../../model/types';
import { DeferredRichTextEditor } from '../../rich-text/DeferredRichTextEditor';
import { isRichTextEmpty } from '../../rich-text/RichTextView';
import { newId } from '../shared';
import type { StepProps } from './ContentTab';
import { SortableList } from './SortableList';

export const isEmptyCard = (card: StudyCard) => !card.label.trim() && isRichTextEmpty(card.description);

/** Tarjetas: the content inventory participants will sort. */
export function CardsStep({ document, update, errors, readOnly }: StepProps) {
  const { t } = useI18n();
  const [bulkOpen, setBulkOpen] = useState(false);
  const { cards } = document;

  const setCards = (next: StudyCard[]) => update((d) => ({ ...d, cards: next }));
  const patchCard = (id: string, patch: Partial<StudyCard>) => update((d) => ({ ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const removeCard = (id: string) => update((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== id) }));

  const addCard = () => {
    const id = newId();
    update((d) => ({ ...d, cards: [...d.cards, { id, label: '', description: null }] }));
    setTimeout(() => window.document.getElementById(`card-row-${id}`)?.querySelector('input')?.focus(), 60);
  };

  // An empty card is removed as soon as focus leaves it.
  const removeIfEmptyOnLeave = (event: FocusEvent<HTMLDivElement>, id: string) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    update((d) => ({ ...d, cards: d.cards.filter((c) => c.id !== id || !isEmptyCard(c)) }));
  };

  return (
    <div className="grid gap-5">
      <Card className="grid gap-5 rounded-3xl border border-border bg-surface p-5 md:p-6">
        <div>
          <h3 className="text-base font-semibold">{t('cardSorting.cards.title')}</h3>
          <p className="text-sm text-muted">{t('cardSorting.cards.description')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SwitchField
            label={t('cardSorting.cards.descriptionsToggle')}
            description={t('cardSorting.cards.descriptionsHint')}
            isSelected={document.cardsHaveDescriptions}
            // The switch answers immediately; revealing the descriptions renders in a transition.
            onChange={(cardsHaveDescriptions) => startTransition(() => update((d) => ({ ...d, cardsHaveDescriptions })))}
            isDisabled={readOnly}
          />
          <SwitchField
            label={t('cardSorting.cards.randomize')}
            description={t('cardSorting.cards.randomizeHint')}
            isSelected={document.randomizeCards}
            onChange={(randomizeCards) => update((d) => ({ ...d, randomizeCards }))}
            isDisabled={readOnly}
          />
        </div>
      </Card>

      <section aria-labelledby="cards-list-heading" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="cards-list-heading" className="text-sm text-muted" aria-live="polite">
            {t('cardSorting.cards.count', { count: cards.length })}
          </h3>
          {errors.cards && <p className="text-sm text-danger">{errors.cards}</p>}
        </div>

        {cards.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t('cardSorting.cards.empty')}</p>}

        <SortableList
          items={cards}
          onReorder={setCards}
          isDisabled={readOnly}
          handleLabel={(card) => t('cardSorting.cards.reorder', { label: card.label || t('cardSorting.cards.untitled') })}
          movedMessage={(card, position) => t('cardSorting.cards.moved', { label: card.label || t('cardSorting.cards.untitled'), position })}
          renderItem={(card, i, handle) => {
            const label = card.label || t('cardSorting.cards.untitled');
            return (
              <Card className="rounded-2xl border border-border bg-surface p-2 md:p-3">
                {/* onBlur only tracks focus leaving the row (auto-removal of empty cards); the controls inside are native. */}
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <div id={`card-row-${card.id}`} className="grid gap-2" onBlur={(event) => !readOnly && removeIfEmptyOnLeave(event, card.id)}>
                  <div className="flex items-center gap-2">
                    {handle}
                    <span aria-hidden="true" className="w-6 shrink-0 text-end text-xs tabular-nums text-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <TextField
                        hideLabel
                        label={t('cardSorting.cards.cardLabel', { number: i + 1 })}
                        name={`card-${card.id}`}
                        isRequired
                        isDisabled={readOnly}
                        maxLength={LIMITS.label}
                        value={card.label}
                        onChange={(value) => patchCard(card.id, { label: value })}
                        error={errors[`cards.${i}.label`]}
                      />
                    </div>
                    {!readOnly && <IconButton size="sm" label={t('cardSorting.cards.remove', { label })} icon={<Trash2 />} onPress={() => removeCard(card.id)} />}
                  </div>
                  <Reveal isOpen={document.cardsHaveDescriptions} lazy>
                    <div className="pb-1 ps-[4.25rem] pe-10">
                      <DeferredRichTextEditor
                        label={t('cardSorting.cards.descriptionLabel', { number: i + 1 })}
                        placeholder={t('cardSorting.cards.descriptionPlaceholder')}
                        value={card.description}
                        onChange={(description) => patchCard(card.id, { description })}
                        error={errors[`cards.${i}.description`]}
                        isDisabled={readOnly}
                      />
                    </div>
                  </Reveal>
                </div>
              </Card>
            );
          }}
        />

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" leadingIcon={<Plus />} onPress={addCard}>
              {t('cardSorting.cards.add')}
            </Button>
            <Button variant="ghost" leadingIcon={<ListPlus />} onPress={() => setBulkOpen(true)}>
              {t('cardSorting.cards.bulkAdd')}
            </Button>
            <p className="text-xs text-muted">{t('cardSorting.cards.autoRemovedHint')}</p>
          </div>
        )}
      </section>

      {bulkOpen && (
        <BulkAddDialog
          onClose={() => setBulkOpen(false)}
          onAdd={(labels) => {
            setCards([...cards, ...labels.map((label) => ({ id: newId(), label, description: null }))]);
            setBulkOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BulkAddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (labels: string[]) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const labels = text
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, LIMITS.label))
    .filter(Boolean);

  return (
    <Dialog
      isOpen
      onClose={onClose}
      hasUnsavedChanges={text.trim() !== ''}
      title={t('cardSorting.cards.bulkTitle')}
      description={t('cardSorting.cards.bulkDescription')}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onPress={requestClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="contrast" isDisabled={labels.length === 0} onPress={() => onAdd(labels)}>
            {t('cardSorting.cards.bulkSubmit', { count: labels.length })}
          </Button>
        </>
      )}
    >
      <TextAreaField label={t('cardSorting.cards.bulkLabel')} name="bulk-cards" rows={10} autoFocus value={text} onChange={setText} />
    </Dialog>
  );
}
