// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      // Kept at warn until all code uses the generated Supabase types.
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'Use the @/ alias instead of a relative parent import (../). See .agents/rules/architecture.md#no-parent-imports',
            },
          ],
        },
      ],
      // Not the core `no-console`: its message cannot link to the rule's doc.
      'no-restricted-globals': [
        'error',
        {
          name: 'console',
          message:
            'No direct console.* call; use the project logger. See .agents/rules/logging.md#no-console',
        },
      ],
    },
  },
  {
    // The logger is the only console writer, plus env.ts, which reports a failed
    // validation before the logger can exist. See .agents/rules/logging.md#no-console
    files: [
      'src/shared/utils/logger.ts',
      'src/shared/utils/logger.test.ts',
      'src/shared/config/env.ts',
    ],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
  {
    // No index.ts: import the source file. See .agents/rules/structure.md
    files: ['src/**/index.ts'],
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
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '*.js',
      '*.mjs',
      '*.cjs',
      'vitest.config.ts',
      'vitest.int.config.ts',
      'src/shared/types/supabase.generated.ts',
    ],
  }
);
