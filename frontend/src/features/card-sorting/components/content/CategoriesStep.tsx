import type { FocusEvent } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { Alert, Button, Card, IconButton, RadioGroupField, SwitchField, TextField } from '@/design-system';
import { useI18n } from '@/i18n';
import { LIMITS, type Category, type SortType } from '../../model/types';
import { newId } from '../shared';
import type { StepProps } from './ContentTab';
import { SortableList } from './SortableList';

const TYPES: SortType[] = ['open', 'hybrid', 'closed'];

/** Sort type and predefined categories (not asked for open sorts). */
export function CategoriesStep({ document, update, errors, readOnly }: StepProps) {
  const { t } = useI18n();
  const { categories, sortType } = document;
  const setCategories = (next: Category[]) => update((d) => ({ ...d, categories: next }));

  const addCategory = () => {
    const id = newId();
    update((d) => ({ ...d, categories: [...d.categories, { id, label: '' }] }));
    setTimeout(() => window.document.getElementById(`category-row-${id}`)?.querySelector('input')?.focus(), 60);
  };

  // An empty category is removed as soon as focus leaves it.
  const removeIfEmptyOnLeave = (event: FocusEvent<HTMLDivElement>, id: string) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id || c.label.trim() !== '') }));
  };

  return (
    <div className="grid gap-5">
      <Card className="rounded-3xl border border-border bg-surface p-5 md:p-6">
        <RadioGroupField
          label={t('cardSorting.categories.typeLabel')}
          value={sortType}
          onChange={(value) => update((d) => ({ ...d, sortType: value as SortType }))}
          isDisabled={readOnly}
          error={errors.sortType}
          options={TYPES.map((type) => ({ value: type, label: t(`cardSorting.types.${type}`), description: t(`cardSorting.types.${type}Description`) }))}
        />
      </Card>

      {sortType === 'open' ? (
        <Alert tone="info" title={t('cardSorting.types.open')}>
          <span className="inline-flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t('cardSorting.categories.openNotice')}
          </span>
        </Alert>
      ) : (
        <section aria-labelledby="categories-heading" className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 id="categories-heading" className="text-base font-semibold">
                {t('cardSorting.categories.title')}
              </h3>
              <p className="text-sm text-muted">{sortType === 'hybrid' ? t('cardSorting.categories.descriptionHybrid') : t('cardSorting.categories.descriptionClosed')}</p>
              {errors.categories && <p className="mt-1 text-sm text-danger">{errors.categories}</p>}
            </div>
            <SwitchField
              label={t('cardSorting.categories.randomize')}
              description={t('cardSorting.categories.randomizeHint')}
              isSelected={document.randomizeCategories}
              onChange={(randomizeCategories) => update((d) => ({ ...d, randomizeCategories }))}
              isDisabled={readOnly}
            />
          </div>

          {categories.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t('cardSorting.categories.empty')}</p>}

          <SortableList
            items={categories}
            onReorder={setCategories}
            isDisabled={readOnly}
            handleLabel={(category) => t('cardSorting.categories.reorder', { label: category.label || t('cardSorting.categories.untitled') })}
            movedMessage={(category, position) => t('cardSorting.cards.moved', { label: category.label || t('cardSorting.categories.untitled'), position })}
            renderItem={(category, i, handle) => (
              <Card className="rounded-2xl border border-border bg-surface p-2 md:p-3">
                {/* onBlur only tracks focus leaving the row (auto-removal of empty categories). */}
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <div id={`category-row-${category.id}`} className="flex items-center gap-2" onBlur={(event) => !readOnly && removeIfEmptyOnLeave(event, category.id)}>
                  {handle}
                  <span aria-hidden="true" className="w-6 shrink-0 text-end text-xs tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TextField
                      hideLabel
                      label={t('cardSorting.categories.categoryLabel', { number: i + 1 })}
                      name={`category-${category.id}`}
                      isRequired
                      isDisabled={readOnly}
                      maxLength={LIMITS.categoryLabel}
                      value={category.label}
                      onChange={(value) => update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === category.id ? { ...c, label: value } : c)) }))}
                      error={errors[`categories.${i}.label`]}
                    />
                  </div>
                  {!readOnly && (
                    <IconButton
                      size="sm"
                      label={t('cardSorting.categories.remove', { label: category.label || t('cardSorting.categories.untitled') })}
                      icon={<Trash2 />}
                      onPress={() => update((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== category.id) }))}
                    />
                  )}
                </div>
              </Card>
            )}
          />

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" leadingIcon={<Plus />} onPress={addCategory}>
                {t('cardSorting.categories.add')}
              </Button>
              <p className="text-xs text-muted">{t('cardSorting.categories.autoRemovedHint')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
