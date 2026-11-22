import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import componentsPlugin from './eslint/plugin-components.mjs';

// CSS named colours (CSS Color Module Level 4), 'transparent' excepted.
const NAMED_COLORS = [
	'aliceblue',
	'antiquewhite',
	'aqua',
	'aquamarine',
	'azure',
	'beige',
	'bisque',
	'black',
	'blanchedalmond',
	'blue',
	'blueviolet',
	'brown',
	'burlywood',
	'cadetblue',
	'chartreuse',
	'chocolate',
	'coral',
	'cornflowerblue',
	'cornsilk',
	'crimson',
	'cyan',
	'darkblue',
	'darkcyan',
	'darkgoldenrod',
	'darkgray',
	'darkgreen',
	'darkgrey',
	'darkkhaki',
	'darkmagenta',
	'darkolivegreen',
	'darkorange',
	'darkorchid',
	'darkred',
	'darksalmon',
	'darkseagreen',
	'darkslateblue',
	'darkslategray',
	'darkslategrey',
	'darkturquoise',
	'darkviolet',
	'deeppink',
	'deepskyblue',
	'dimgray',
	'dimgrey',
	'dodgerblue',
	'firebrick',
	'floralwhite',
	'forestgreen',
	'fuchsia',
	'gainsboro',
	'ghostwhite',
	'gold',
	'goldenrod',
	'gray',
	'green',
	'greenyellow',
	'grey',
	'honeydew',
	'hotpink',
	'indianred',
	'indigo',
	'ivory',
	'khaki',
	'lavender',
	'lavenderblush',
	'lawngreen',
	'lemonchiffon',
	'lightblue',
	'lightcoral',
	'lightcyan',
	'lightgoldenrodyellow',
	'lightgray',
	'lightgreen',
	'lightgrey',
	'lightpink',
	'lightsalmon',
	'lightseagreen',
	'lightskyblue',
	'lightslategray',
	'lightslategrey',
	'lightsteelblue',
	'lightyellow',
	'lime',
	'limegreen',
	'linen',
	'magenta',
	'maroon',
	'mediumaquamarine',
	'mediumblue',
	'mediumorchid',
	'mediumpurple',
	'mediumseagreen',
	'mediumslateblue',
	'mediumspringgreen',
	'mediumturquoise',
	'mediumvioletred',
	'midnightblue',
	'mintcream',
	'mistyrose',
	'moccasin',
	'navajowhite',
	'navy',
	'oldlace',
	'olive',
	'olivedrab',
	'orange',
	'orangered',
	'orchid',
	'palegoldenrod',
	'palegreen',
	'paleturquoise',
	'palevioletred',
	'papayawhip',
	'peachpuff',
	'peru',
	'pink',
	'plum',
	'powderblue',
	'purple',
	'rebeccapurple',
	'red',
	'rosybrown',
	'royalblue',
	'saddlebrown',
	'salmon',
	'sandybrown',
	'seagreen',
	'seashell',
	'sienna',
	'silver',
	'skyblue',
	'slateblue',
	'slategray',
	'slategrey',
	'snow',
	'springgreen',
	'steelblue',
	'tan',
	'teal',
	'thistle',
	'tomato',
	'turquoise',
	'violet',
	'wheat',
	'white',
	'whitesmoke',
	'yellow',
	'yellowgreen',
];

// Each no-restricted-syntax rule gets its own name, so its errors name the rule they break.
// See .agents/rules/guardrails.md#append-only-rules
const restrictedSyntax = builtinRules.get('no-restricted-syntax');
const guardrailsPlugin = {
	rules: {
		'ui-primitives': restrictedSyntax,
		'theme-tokens': restrictedSyntax,
		'zustand-selector': restrictedSyntax,
		'text-primitives': restrictedSyntax,
		'font-families': restrictedSyntax,
	},
};

export default [
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

	js.configs.recommended,

	...tseslint.configs.recommended.map((config) => ({
		...config,
		ignores: ['babel.config.js', 'plugins/**/*.js', '*.cjs'],
	})),

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
			'@typescript-eslint/no-require-imports': 'off',
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},

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
			'prettier/prettier': 'warn',

			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-require-imports': 'error',

			'react/react-in-jsx-scope': 'off', // Not needed with React 17+
			'react/prop-types': 'off', // Using TypeScript for prop validation
			...reactHooksPlugin.configs.recommended.rules,
			// React Compiler rules kept as warnings: `immutability` flags Reanimated shared values by design,
			// and the `set-state-in-effect` cases are realtime hooks to refactor with device testing.
			'react-hooks/immutability': 'warn',
			'react-hooks/set-state-in-effect': 'warn',
		},
	},

	// Project guardrails, on the app code and its tests.
	{
		files: ['src/**/*.{ts,tsx}'],
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
						'Use Pressable or Button from @/shared/theme/components/, not TouchableOpacity or Pressable from react-native. See .agents/rules/structure.md#ui-primitives',
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
						'No colour literal outside the theme modules; read the colour from the theme (theme.colors.*). See .agents/rules/structure.md#theme-tokens',
				},
				{
					// Named colours are common words ('snow' is also an icon), so only
					// a colour prop or style key (color, backgroundColor...) is checked.
					selector: [
						'Property[key.name=/(^c|C)olor$/] > Literal.value',
						'JSXAttribute[name.name=/(^c|C)olor$/] > Literal.value',
						'JSXAttribute[name.name=/(^c|C)olor$/] > JSXExpressionContainer > Literal.expression',
					]
						.map((node) => `${node}[value=/^(${NAMED_COLORS.join('|')})$/i]`)
						.join(', '),
					message:
						'No named colour outside the theme modules; read the colour from the theme (theme.colors.*). See .agents/rules/structure.md#theme-tokens',
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
			'guardrails/text-primitives': [
				'error',
				{
					selector:
						"ImportDeclaration[source.value='react-native'][importKind='value'] > ImportSpecifier[importKind='value'][imported.name=/^(Text|TextInput)$/]",
					message:
						'Use Text or TextInput from @/shared/theme/components/, not from react-native: they set the brand font. See .agents/rules/structure.md#text-primitives',
				},
			],
			'guardrails/font-families': [
				'error',
				{
					selector: [
						"Property[key.name='fontWeight']",
						"Property[key.name='fontFamily'] > Literal.value",
						"JSXAttribute[name.name='fontFamily']",
					].join(', '),
					message:
						'No fontWeight and no font name outside the theme modules; read the family from theme.typography.families (FONT_FAMILIES). See .agents/rules/structure.md#font-families',
				},
			],
			'components/screen-orchestrator-only': 'error',
			'components/orchestrator-no-fetch': 'error',
		},
	},
	{
		files: [
			'src/shared/theme/components/Button.test.tsx',
			'src/shared/theme/components/Button.tsx',
			'src/shared/theme/components/GenreChip.tsx',
			'src/shared/theme/components/Input.test.tsx',
			'src/shared/theme/components/Input.tsx',
			'src/shared/theme/components/KeyButton.tsx',
			'src/shared/theme/components/LoadingSpinner.test.tsx',
			'src/shared/theme/components/LoadingSpinner.tsx',
			'src/shared/theme/components/PlaylistCardSkeleton.tsx',
			'src/shared/theme/components/Pressable.test.tsx',
			'src/shared/theme/components/Pressable.tsx',
			'src/shared/theme/components/Skeleton.test.tsx',
			'src/shared/theme/components/Skeleton.tsx',
			'src/shared/theme/components/SkeletonBlock.tsx',
			'src/shared/theme/components/SkeletonList.tsx',
			'src/shared/theme/components/SkeletonRow.tsx',
			'src/shared/theme/components/Text.test.tsx',
			'src/shared/theme/components/Text.tsx',
			'src/shared/theme/components/TextInput.tsx',
			'src/shared/theme/components/ThemedSwitch.tsx',
			'src/shared/theme/components/TrackRowSkeleton.tsx',
			'src/shared/theme/components/UserRowSkeleton.tsx',
			'src/shared/theme/lib/createRowSkeletonStyles.ts',
		],
		rules: { 'guardrails/ui-primitives': 'off' },
	},
	{
		files: [
			'src/shared/theme/hooks/useThemedStyles.ts',
			'src/shared/image-colors/lib/adaptivePalette.test.ts',
			'src/shared/image-colors/lib/adaptivePalette.ts',
			'src/shared/theme/lib/focusedFieldStyle.ts',
			'src/shared/theme/configs/fontsConfig.ts',
			'src/features/shell/configs/navigationFontsConfig.ts',
			'src/shared/theme/configs/originalThemeConfig.ts',
			'src/shared/theme/lib/pixelFrame.ts',
			'src/shared/theme/configs/tokensThemeConfig.ts',
			'src/shared/theme/types/themeTypes.ts',
		],
		rules: { 'guardrails/theme-tokens': 'off', 'guardrails/font-families': 'off' },
	},
	{
		files: ['src/shared/theme/components/Text.tsx', 'src/shared/theme/components/TextInput.tsx'],
		rules: { 'guardrails/text-primitives': 'off' },
	},

	// Prettier must be last to override other formatting rules
	prettierConfig,
];
