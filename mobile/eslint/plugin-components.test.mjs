import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import tseslint from 'typescript-eslint';
import screenOrchestratorOnly from './rules/screen-orchestrator-only.mjs';
import orchestratorNoFetch from './rules/orchestrator-no-fetch.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tseslint.parser,
		ecmaVersion: 2022,
		sourceType: 'module',
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
	},
});

ruleTester.run('screen-orchestrator-only', screenOrchestratorOnly, {
	valid: [
		{
			code: "import { LoginContainer } from '@/features/auth/login/components/orchestrators/LoginContainer';",
			filename: '/app/mobile/src/app/AuthNavigator.tsx',
		},
		{
			code: "import type { Playlist } from '@/features/playlists/types';",
			filename: '/app/mobile/src/app/stacks/PlaylistsStack.tsx',
		},
		{
			code: "import { SomeComponent } from '@/shared/components/ui/Button';",
			filename: '/app/mobile/src/app/AppNavigator.tsx',
		},
		{
			code: "import { LoginContainer } from '@/features/auth/login/LoginContainer';",
			filename: '/app/mobile/src/app/AuthNavigator.tsx',
		},
		{
			code: "import { FooView } from './presenters/FooView';",
			filename: '/app/mobile/src/features/foo/FooOrchestrator.tsx',
		},
	],
	invalid: [
		{
			code: "import { LoginView } from '@/features/auth/login/components/presenters/LoginView';",
			filename: '/app/mobile/src/app/AuthNavigator.tsx',
			errors: [{ messageId: 'noPresenterInScreen' }],
		},
		{
			code: "import { PlaylistDetailView } from '@/features/playlists/detail/components/presenters/PlaylistDetailView';",
			filename: '/app/mobile/src/app/stacks/PlaylistsStack.tsx',
			errors: [{ messageId: 'noPresenterInScreen' }],
		},
	],
});

ruleTester.run('orchestrator-no-fetch', orchestratorNoFetch, {
	valid: [
		{
			code: 'export function MyOrch() { const { data } = useMyData(); return <MyView data={data} />; }',
			filename: '/app/mobile/src/features/foo/orchestrators/MyOrch.tsx',
		},
	],
	invalid: [
		{
			code: "export function MyContainer() { const load = () => fetch('/api/foo'); return <MyView />; }",
			filename: '/app/mobile/src/features/foo/MyContainer.tsx',
			errors: [{ messageId: 'noDirectFetch' }],
		},
		{
			code: "export function MyOrch() { const load = () => fetch('/api/foo'); return <MyView />; }",
			filename: '/app/mobile/src/features/foo/orchestrators/MyOrch.tsx',
			errors: [{ messageId: 'noDirectFetch' }],
		},
		{
			code: "import { apiRequest } from '@/shared/services/api';",
			filename: '/app/mobile/src/features/foo/orchestrators/MyOrch.tsx',
			errors: [{ messageId: 'noRawApiClientImport' }],
		},
		{
			code: 'export function MyOrch() { const load = () => apiRequest("/api/foo"); return <MyView />; }',
			filename: '/app/mobile/src/features/foo/orchestrators/MyOrch.tsx',
			errors: [{ messageId: 'noDirectFetch' }],
		},
	],
});
