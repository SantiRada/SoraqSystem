/*
 * Soraq Design System — public API (built on HeroUI v3, docs/decisions/0007).
 *
 * Features import UI ONLY from '@/design-system' — never from '@heroui/react' directly
 * (enforced by ESLint). This keeps the library swappable and our conventions in one place.
 *
 * - Wrapped components: add Soraq behaviour/defaults (i18n, a11y, variants).
 * - Re-exported components: HeroUI compound components used as-is.
 */

// Wrapped
export { Alert, type AlertTone } from './components/Alert';
export { Badge, type BadgeTone } from './components/Badge';
export { CheckboxField, CheckboxGroupField, RadioGroupField, SwitchField, type ChoiceOption } from './components/Choice';
export { ColorPickerField } from './components/ColorPickerField';
export { Button, ButtonAnchor, ButtonLink, type ButtonProps, type ButtonVariant, type ButtonSize } from './components/Button';
export { Dialog } from './components/Dialog';
export { EmptyState } from './components/EmptyState';
export { PasswordField, TextAreaField, TextField } from './components/Fields';
export { IconButton } from './components/IconButton';
export { LoadingState } from './components/LoadingState';
export { Logo } from './components/Logo';
export { PageHeader } from './components/PageHeader';
export { SelectField, type SelectOption } from './components/SelectField';
export { Reveal } from './components/Reveal';
export { SkipLink } from './components/SkipLink';
export { Toast, type ToastTone } from './components/Toast';

// Re-exported HeroUI primitives
export { Avatar, Card, Chip, Drawer, Dropdown, Separator, Spinner, Tabs, ToggleButton, ToggleButtonGroup } from '@heroui/react';
