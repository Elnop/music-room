import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

// Aliases from babel.config.js and tsconfig.json other than @/, kept only
// until the files that use them migrate.
const LEGACY_ALIASES = [
  '@api',
  '@components',
  '@contexts',
  '@screens',
  '@services',
  '@store',
  '@hooks',
  '@utils',
  '@themes',
  '@constants',
];

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      '**/node_modules/**',
      '**/.expo/**',
      '**/.expo-shared/**',
      '**/dist/**',
      '**/*.jks',
      '**/*.p8',
      '**/*.p12',
      '**/*.key',
      '**/*.mobileprovision',
      '**/*.orig.*',
      '**/web-build/**',
    ],
  },

  // Base recommended configs
  js.configs.recommended,

  // TypeScript config - exclude config files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    ignores: ['babel.config.js', 'plugins/**/*.js', '*.cjs'],
  })),

  // Special configuration for CommonJS config files (babel, plugins)
  {
    files: ['babel.config.js', 'plugins/**/*.js', '*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // Allow require() in config files
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // Main configuration for TypeScript and React files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['babel.config.js', 'plugins/**/*.js', '*.cjs'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'error', // Disallow require() in source files

      // React rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      ...reactHooksPlugin.configs.recommended.rules,
      // React Compiler rules from eslint-plugin-react-hooks 7.1, kept visible
      // as warnings: `immutability` flags Reanimated shared values
      // (`sv.value = x`) by design, and the `set-state-in-effect` cases are
      // realtime hooks to refactor with device testing, not blindly.
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',

      // No console.* at all. Not the core `no-console`: its message cannot
      // point to the rule's doc.
      'no-restricted-globals': [
        'error',
        {
          name: 'console',
          message:
            'No direct console.* call; use the project logger. See .agents/rules/logging.md#no-console',
        },
      ],

      // Imports that leave the current folder go through @/.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Use the @/ alias instead of a relative parent import (../). See .agents/rules/architecture.md#no-parent-imports',
            },
            {
              group: LEGACY_ALIASES.flatMap(alias => [alias, `${alias}/*`]),
              message:
                'Only the @/ alias is allowed (@/components/..., not @components/...). See .agents/rules/architecture.md#no-legacy-aliases',
            },
          ],
        },
      ],
    },
  },

  // The logger is the only code that writes to the console. The ErrorBoundary
  // test mutes React's own log of the caught error.
  // See .agents/rules/logging.md#no-console
  {
    files: [
      'src/utils/logger.ts',
      'src/utils/logger.test.ts',
      'src/components/common/ErrorBoundary.test.tsx',
    ],
    rules: {
      'no-restricted-globals': 'off',
    },
  },

  // No index.ts: import the source file.
  {
    files: ['src/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'Files named index.ts are forbidden; name the file after what it holds and import it directly. See .agents/rules/structure.md#no-index-files',
        },
      ],
    },
  },

  // Prettier must be last to override other formatting rules
  prettierConfig,
];
