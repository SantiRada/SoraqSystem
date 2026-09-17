import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/design-system';
import { useI18n } from '@/i18n';
import { useTheme } from './ThemeContext';

/** The label describes the ACTION ("Cambiar a modo claro"), so the result is predictable. */
export function ThemeToggle({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      size={size}
      label={theme === 'dark' ? t('common.theme.toLight') : t('common.theme.toDark')}
      icon={theme === 'dark' ? <Sun /> : <Moon />}
      onPress={toggleTheme}
    />
  );
}
