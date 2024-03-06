import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import mdx from 'eslint-plugin-mdx';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ErrnoException: false,
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: ts.configs.strict.rules,
  },
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        JSX: false,
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      react,
      '@next/next': next,
      'react-hooks': hooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
      next: {
        rootDir: 'docs',
      },
    },
    rules: {
      ...ts.configs.strict.rules,
      ...react.configs['jsx-runtime'].rules,
      ...hooks.configs.recommended.rules,
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  {
    files: ['**/*.mdx'],
    ...mdx.flat,
    rules: {
      ...mdx.flat.rules,
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.mdx'],
    ...mdx.flatCodeBlocks,
  },
  {
    ignores: ['**/.next', '**/dist'],
  },
];
