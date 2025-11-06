import nextPlugin from '@next/eslint-plugin-next';
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'no-var': 'off',
    },
  },
  // eslint-plugin-unused-imports
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  // simple-import-sort
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  // stylistic
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/array-bracket-newline': [
        'error',
        {
          multiline: true,
          minItems: 5,
        },
      ],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/block-spacing': 'error',
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/computed-property-spacing': ['error', 'never'],
      '@stylistic/curly-newline': 'error',
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
      '@stylistic/generator-star-spacing': ['error', 'after'],
      '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/indent-binary-ops': ['error', 2],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/jsx-curly-spacing': [
        'error',
        {
          when: 'never',
          children: true,
        },
      ],
      '@stylistic/jsx-closing-tag-location': 'error',
      '@stylistic/jsx-closing-bracket-location': 'error',
      '@stylistic/jsx-equals-spacing': 'error',
      '@stylistic/jsx-self-closing-comp': 'error',
      '@stylistic/jsx-sort-props': 'error',
      '@stylistic/jsx-tag-spacing': 'error',
      '@stylistic/jsx-wrap-multilines': 'error',
      '@stylistic/key-spacing': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/new-parens': 'error',
      '@stylistic/no-confusing-arrow': 'error',
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      '@stylistic/no-tabs': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/object-curly-newline': 'error',
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/object-property-newline': 'error',
      '@stylistic/operator-linebreak': ['error', 'none'],
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/semi-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      '@stylistic/semi-style': ['error', 'last'],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': 'error',
      '@stylistic/switch-colon-spacing': 'error',
      '@stylistic/template-curly-spacing': ['error', 'never'],
      '@stylistic/template-tag-spacing': 'error',
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error',
      '@stylistic/type-named-tuple-spacing': 'error',
      '@stylistic/wrap-iife': 'error',
    },
  },
];

export default eslintConfig;
