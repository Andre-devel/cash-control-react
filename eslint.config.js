import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactPlugin from 'eslint-plugin-react'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  { ignores: ['dist', 'node_modules', 'coverage', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // O service worker roda fora do escopo de window/document — precisa dos globals de
    // worker (self, ServiceWorkerGlobalScope, caches) e não dos de browser.
    files: ['src/sw.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      react: reactPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Specs do Playwright rodam no Node; o `use` das fixtures não é hook do React.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
]
