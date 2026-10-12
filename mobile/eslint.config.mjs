import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

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
    ignores: ['babel.config.js', 'plugins/**/*.js'],
  })),

  // Special configuration for CommonJS config files (babel, plugins)
  {
    files: ['babel.config.js', 'plugins/**/*.js'],
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
    ignores: ['babel.config.js', 'plugins/**/*.js'],
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

      // Console rules - allow console.log in development (__DEV__ wrapped)
      'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
    },
  },

  // Prettier must be last to override other formatting rules
  prettierConfig,
];
