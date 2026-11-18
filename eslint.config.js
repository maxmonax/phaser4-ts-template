import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', 'coverage/', 'public/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The ESM build of Phaser does not register a global object:
      // code that relies on it compiles, but fails at runtime.
      'no-restricted-globals': [
        'error',
        { name: 'Phaser', message: "Import it explicitly: import * as Phaser from 'phaser'." },
      ],
    },
  },
  {
    // Build scripts run in Node.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Turns off formatting rules that would conflict with Prettier. Keep it last.
  prettier
);
