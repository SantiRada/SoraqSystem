import type { ReactNode } from 'react';
import { Checkbox, CheckboxGroup, Description, FieldError, Label, Radio, RadioGroup, Switch } from '@heroui/react';
import { cn } from '@/shared/lib/cn';

/**
 * Selection controls on top of HeroUI (React Aria): label association, keyboard support
 * (Space toggles, arrow keys move between radios) and error wiring come from the primitives.
 */

interface SwitchFieldProps {
  label: string;
  description?: ReactNode;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

export function SwitchField({ label, description, isSelected, onChange, isDisabled, className }: SwitchFieldProps) {
  return (
    <Switch isSelected={isSelected} onChange={onChange} isDisabled={isDisabled} className={cn('gap-1', className)}>
      <Switch.Content className="gap-3">
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-sm font-medium">{label}</Label>
      </Switch.Content>
      {description && <Description className="ps-12 text-sm text-muted">{description}</Description>}
    </Switch>
  );
}

export interface ChoiceOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
}

interface RadioGroupFieldProps {
  label: string;
  /** Visually hide the group label (still announced). */
  hideLabel?: boolean;
  options: ChoiceOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string | null;
  isRequired?: boolean;
  isDisabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function RadioGroupField({ label, hideLabel, options, value, onChange, error, isRequired, isDisabled, orientation = 'vertical', className }: RadioGroupFieldProps) {
  return (
    <RadioGroup
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      orientation={orientation}
      validationBehavior="aria"
      className={cn('gap-2', className)}
    >
      <Label className={cn('text-sm font-medium', hideLabel && 'sr-only')}>{label}</Label>
      <div className={cn('flex gap-2', orientation === 'vertical' ? 'flex-col' : 'flex-wrap')}>
        {options.map((option) => (
          <Radio key={option.value} value={option.value}>
            <Radio.Content className="gap-3">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <span className="grid gap-0.5">
                <Label className="text-sm">{option.label}</Label>
                {option.description && <Description className="text-xs text-muted">{option.description}</Description>}
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </div>
      {error && <FieldError className="text-sm text-danger">{error}</FieldError>}
    </RadioGroup>
  );
}

interface CheckboxGroupFieldProps {
  label: string;
  hideLabel?: boolean;
  options: ChoiceOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string | null;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function CheckboxGroupField({ label, hideLabel, options, value, onChange, error, isRequired, isDisabled, className }: CheckboxGroupFieldProps) {
  return (
    <CheckboxGroup
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      className={cn('gap-2', className)}
    >
      <Label className={cn('text-sm font-medium', hideLabel && 'sr-only')}>{label}</Label>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Checkbox key={option.value} value={option.value}>
            <Checkbox.Content className="gap-3">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label className="text-sm">{option.label}</Label>
            </Checkbox.Content>
          </Checkbox>
        ))}
      </div>
      {error && <FieldError className="text-sm text-danger">{error}</FieldError>}
    </CheckboxGroup>
  );
}

interface CheckboxFieldProps {
  label: ReactNode;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
  className?: string;
}

/** A single checkbox (e.g. "Obligatoria"). */
export function CheckboxField({ label, isSelected, onChange, isDisabled, className }: CheckboxFieldProps) {
  return (
    <Checkbox isSelected={isSelected} onChange={onChange} isDisabled={isDisabled} className={className}>
      <Checkbox.Content className="gap-2">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label className="text-sm">{label}</Label>
      </Checkbox.Content>
    </Checkbox>
  );
}
