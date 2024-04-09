import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import mdx from 'eslint-plugin-mdx';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import jsdoc from 'eslint-plugin-jsdoc';
import cspell from '@cspell/eslint-plugin';
import globals from 'globals';

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    plugins: { '@cspell': cspell },
    rules: { '@cspell/spellchecker': 'error' },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ErrnoException: false,
      },
    },
    plugins: { '@typescript-eslint': ts },
    rules: ts.configs.strict.rules,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        JSX: false,
        process: false, // mocked by webpack
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      react,
      '@next/next': next,
      'react-hooks': hooks,
    },
    settings: {
      react: { version: 'detect' },
      next: { rootDir: 'packages/docs' },
    },
    rules: {
      ...ts.configs.strict.rules,
      ...react.configs['jsx-runtime'].rules,
      ...hooks.configs.recommended.rules,
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.mdx'],
    ...mdx.flat,
    rules: {
      ...mdx.flat.rules,
      'no-unused-vars': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
  {
    files: ['**/*.mdx'],
    ...mdx.flatCodeBlocks,
  },
  {
    ignores: ['**/.next', '**/dist', '**/public'],
  },
];
