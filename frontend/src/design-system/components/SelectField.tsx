import type { Key } from 'react';
import { Description, FieldError, Label, ListBox, Select } from '@heroui/react';

export interface SelectOption {
  id: string;
  label: string;
  /** Optional secondary line (e.g. what a role can do). */
  description?: string;
}

interface SelectFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
  error?: string | null;
  isDisabled?: boolean;
  /** Visually hide the label (e.g. inline role selector in a list); it stays accessible. */
  hideLabel?: boolean;
  className?: string;
}

/** Accessible single-select (HeroUI Select / React Aria): keyboard, typeahead, screen reader. */
export function SelectField({ label, value, onChange, options, hint, error, isDisabled, hideLabel, className }: SelectFieldProps) {
  return (
    <Select
      value={value}
      onChange={(key: Key | null) => key !== null && onChange(String(key))}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      className={className}
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && <Label className="text-sm font-medium">{label}</Label>}
      <Select.Trigger className="min-h-10">
        {/* Trigger shows only the label; descriptions are for the open list. */}
        <Select.Value>{({ selectedText, defaultChildren }) => selectedText ?? defaultChildren}</Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      {hint && <Description className="text-sm text-muted">{hint}</Description>}
      <FieldError className="text-sm">{error}</FieldError>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.description && <span className="text-xs text-muted">{option.description}</span>}
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
