import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-site/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'This project makes no network requests at runtime. See docs/DECISIONS.md (privacy).',
        },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'fetch', message: 'No network requests at runtime.' },
        { object: 'navigator', property: 'sendBeacon', message: 'No network requests at runtime.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='XMLHttpRequest']",
          message: 'No network requests at runtime.',
        },
        {
          selector: "NewExpression[callee.name='WebSocket']",
          message: 'No network requests at runtime.',
        },
        {
          selector: "NewExpression[callee.name='EventSource']",
          message: 'No network requests at runtime.',
        },
      ],
    },
  },
  {
    files: ['**/*.mjs', '**/*.js', 'scripts/**/*'],
    ...tseslint.configs.disableTypeChecked,
    rules: { 'no-restricted-globals': 'off', 'no-restricted-syntax': 'off' },
  },
  {
    // The service worker is the one place a fetch is legitimate: it serves
    // the app's own precached files, and refuses anything cross-origin.
    // The two placeholders are substituted at build time.
    files: ['apps/*/src/sw/**/*.js', 'apps/*/src/sw/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        __PRECACHE__: 'readonly',
        __CACHE_NAME__: 'readonly',
      },
    },
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
      'no-undef': 'off',
    },
  },
);
