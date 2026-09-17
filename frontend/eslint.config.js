import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.strict],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      // autoFocus is allowed only through our components (e.g. first field of a dialog, docs/GUIDELINES.md §2).
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
      // Architecture guard: features must not import other features' internals.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/*/*'], message: 'Import other features through their public index (@/features/<name>).' },
            { group: ['@heroui/*', 'react-aria-components'], message: 'Use @/design-system (UI library is wrapped there, see ADR 0007).' },
            { group: ['@/i18n/locales/*'], message: 'Use useI18n() instead of importing catalogs.' },
          ],
        },
      ],
      // Never expose secrets through a hard-coded string or dangerouslySetInnerHTML without review.
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Avoid dangerouslySetInnerHTML (XSS). See docs/SECURITY_AUDIT.md.' },
      ],
    },
  },
  {
    // The only places allowed to touch the UI library / router bridge / catalogs directly.
    files: ['src/design-system/**', 'src/shared/lib/cn.ts', 'src/app/layouts/RootLayout.tsx', 'src/i18n/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
