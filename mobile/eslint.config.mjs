import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import componentsPlugin from './eslint/plugin-components.mjs';

// Aliases removed by #377: @/ is the only one left (babel.config.js,
// tsconfig.json). Still banned so they cannot come back.
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

// CSS named colours (CSS Color Module Level 4), 'transparent' excepted.
const NAMED_COLORS = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow',
  'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
  'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred',
  'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell',
  'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
  'whitesmoke', 'yellow', 'yellowgreen',
];

// Project rules built on the core no-restricted-syntax: each one gets its own
// name, so its exceptions are counted apart in eslint-suppressions.json.
// See .agents/rules/guardrails.md#append-only-rules
const restrictedSyntax = builtinRules.get('no-restricted-syntax');
const guardrailsPlugin = {
  rules: {
    'ui-primitives': restrictedSyntax,
    'theme-tokens': restrictedSyntax,
    'zustand-selector': restrictedSyntax,
  },
};

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
      'src/shared/utils/logger.ts',
      'src/shared/utils/logger.test.ts',
      'src/shared/components/feedback/ErrorBoundary.test.tsx',
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

  // Project guardrails (#377), on the app code and its tests.
  {
    files: ['src/**/*.{ts,tsx}', 'App.tsx'],
    plugins: {
      guardrails: guardrailsPlugin,
      components: componentsPlugin,
    },
    rules: {
      'guardrails/ui-primitives': [
        'error',
        {
          selector: [
            "ImportDeclaration[source.value='react-native'] > ImportSpecifier[imported.name=/^(TouchableOpacity|Pressable)$/]",
            // Namespace or required access: <RN.Pressable />, RN.TouchableOpacity.
            'JSXMemberExpression[property.name=/^(TouchableOpacity|Pressable)$/]',
            'MemberExpression[property.name=/^(TouchableOpacity|Pressable)$/]',
          ].join(', '),
          message:
            'Use Pressable or Button from @/shared/components/ui/, not TouchableOpacity or Pressable from react-native. See .agents/rules/structure.md#ui-primitives',
        },
      ],
      'guardrails/theme-tokens': [
        'error',
        {
          // A string or the text of a template literal (`rgba(${r}, ...)`).
          selector: [
            'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
            'Literal[value=/^(rgb|rgba|hsl|hsla)\\(/i]',
            'TemplateElement[value.raw=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
            'TemplateElement[value.raw=/^(rgb|rgba|hsl|hsla)\\(/i]',
          ].join(', '),
          message:
            'No colour literal outside src/shared/theme/; read the colour from the theme (theme.colors.*). See .agents/rules/structure.md#theme-tokens',
        },
        {
          // Named colours are common words ('snow' is also an icon), so only
          // a colour prop or style key (color, backgroundColor...) is checked.
          selector: [
            'Property[key.name=/(^c|C)olor$/] > Literal.value',
            'JSXAttribute[name.name=/(^c|C)olor$/] > Literal.value',
            'JSXAttribute[name.name=/(^c|C)olor$/] > JSXExpressionContainer > Literal.expression',
          ]
            .map(node => `${node}[value=/^(${NAMED_COLORS.join('|')})$/i]`)
            .join(', '),
          message:
            'No named colour outside src/shared/theme/; read the colour from the theme (theme.colors.*). See .agents/rules/structure.md#theme-tokens',
        },
      ],
      'guardrails/zustand-selector': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^use\\w+Store$/][arguments.length=0]',
          message:
            'Call a Zustand store hook with a selector (useXStore(state => state.x)), never without: it re-renders on every change of the store. See .agents/rules/state.md#zustand-selectors',
        },
      ],
      'components/screen-orchestrator-only': 'error',
      'components/presenter-pure': 'error',
      'components/hook-no-jsx': 'error',
      'components/one-component-per-file': 'error',
      'components/component-role-directory': 'error',
      'components/orchestrator-no-fetch': 'error',
    },
  },
  {
    files: ['src/shared/components/ui/**'],
    rules: { 'guardrails/ui-primitives': 'off' },
  },
  {
    files: ['src/shared/theme/**'],
    rules: { 'guardrails/theme-tokens': 'off' },
  },

  // Prettier must be last to override other formatting rules
  prettierConfig,
];
