import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import tseslint from 'typescript-eslint';
import screenOrchestratorOnly from './rules/screen-orchestrator-only.mjs';
import presenterPure from './rules/presenter-pure.mjs';
import hookNoJsx from './rules/hook-no-jsx.mjs';
import oneComponentPerFile from './rules/one-component-per-file.mjs';
import componentRoleDirectory from './rules/component-role-directory.mjs';
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
			code: "import { LoginOrchestrator } from '@/features/auth/login/components/orchestrators/LoginOrchestrator';",
			filename: '/app/mobile/src/navigation/AuthNavigator.tsx',
		},
		{
			code: "import type { Playlist } from '@/features/playlists/types';",
			filename: '/app/mobile/src/navigation/stacks/PlaylistsStack.tsx',
		},
		{
			code: "import { SomeComponent } from '@/shared/components/ui/Button';",
			filename: '/app/mobile/src/navigation/AppNavigator.tsx',
		},
		{
			code: "import { FooView } from './presenters/FooView';",
			filename: '/app/mobile/src/features/foo/FooOrchestrator.tsx',
		},
	],
	invalid: [
		{
			code: "import { LoginView } from '@/features/auth/login/components/presenters/LoginView';",
			filename: '/app/mobile/src/navigation/AuthNavigator.tsx',
			errors: [{ messageId: 'noPresenterInScreen' }],
		},
		{
			code: "import { PlaylistDetailView } from '@/features/playlists/detail/components/presenters/PlaylistDetailView';",
			filename: '/app/mobile/src/navigation/stacks/PlaylistsStack.tsx',
			errors: [{ messageId: 'noPresenterInScreen' }],
		},
	],
});

ruleTester.run('presenter-pure', presenterPure, {
	valid: [
		{
			code: 'export function MyView({ count }) { return <div>{count}</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
		},
		{
			code: 'export function MyView() { const { theme } = useTheme(); return <div>{theme}</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
		},
		{
			code: 'export function MyView() { const styles = React.useMemo(() => ({}), []); return <div style={styles} />; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
		},
	],
	invalid: [
		{
			code: 'export function MyView() { const [x, setX] = useState(0); return <div>{x}</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
			errors: [{ messageId: 'noStateOrEffect' }],
		},
		{
			code: 'export function MyView() { useEffect(() => {}, []); return <div />; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
			errors: [{ messageId: 'noStateOrEffect' }],
		},
		{
			code: 'export function MyView() { const user = useAuthStore(s => s.user); return <div>{user}</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
			errors: [{ messageId: 'noStore' }],
		},
		{
			code: "import { useAuthStore } from '@/features/auth/stores/authStore';",
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
			errors: [{ messageId: 'noStoreImport' }],
		},
		{
			code: 'export function MyView() { const data = useQuery(); return <div />; }',
			filename: '/app/mobile/src/features/foo/presenters/MyView.tsx',
			errors: [{ messageId: 'noQuery' }],
		},
	],
});

ruleTester.run('hook-no-jsx', hookNoJsx, {
	valid: [
		{
			code: 'export function useCounter() { const [count, setCount] = useState(0); return { count }; }',
			filename: '/app/mobile/src/features/foo/hooks/useCounter.ts',
		},
		{
			code: 'export function useData() { return { data: [1, 2, 3] }; }',
			filename: '/app/mobile/src/hooks/useData.ts',
		},
	],
	invalid: [
		{
			code: 'export function useBanner() { return <View><Text>Hi</Text></View>; }',
			filename: '/app/mobile/src/features/foo/hooks/useBanner.tsx',
			errors: [{ messageId: 'noJsxElement' }, { messageId: 'noJsxElement' }],
		},
		{
			code: 'export function useFrag() { return <>test</>; }',
			filename: '/app/mobile/src/features/foo/hooks/useFrag.tsx',
			errors: [{ messageId: 'noJsxFragment' }],
		},
	],
});

ruleTester.run('one-component-per-file', oneComponentPerFile, {
	valid: [
		{
			code: 'export function One() { return <div>One</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/One.tsx',
		},
		{
			code: 'export const One = () => <div>One</div>;',
			filename: '/app/mobile/src/features/foo/presenters/One.tsx',
		},
		{
			code: 'function helper() { return 42; } export function One() { return <div>{helper()}</div>; }',
			filename: '/app/mobile/src/features/foo/presenters/One.tsx',
		},
	],
	invalid: [
		{
			code: `
				function SubHeader() { return <div>Sub</div>; }
				export function MainView() { return <div><SubHeader /></div>; }
			`,
			filename: '/app/mobile/src/features/foo/presenters/MainView.tsx',
			errors: [{ messageId: 'oneComponentPerFile' }],
		},
		{
			code: `
				export const First = () => <div>1</div>;
				export const Second = () => <div>2</div>;
				export const Third = () => <div>3</div>;
			`,
			filename: '/app/mobile/src/features/foo/presenters/TriView.tsx',
			errors: [
				{ messageId: 'oneComponentPerFile' },
				{ messageId: 'oneComponentPerFile' },
			],
		},
	],
});

ruleTester.run('component-role-directory', componentRoleDirectory, {
	valid: [
		{
			code: 'export function MyView() { return <div>test</div>; }',
			filename: '/app/mobile/src/features/foo/bar/components/presenters/MyView.tsx',
		},
		{
			code: 'export function MyOrch() { return <MyView />; }',
			filename: '/app/mobile/src/features/foo/bar/components/orchestrators/MyOrch.tsx',
		},
		{
			code: 'export function MyProvider() { return <Context.Provider value={{}} />; }',
			filename: '/app/mobile/src/features/foo/context/MyProvider.tsx',
		},
		{
			code: 'export function useX() { return 1; }',
			filename: '/app/mobile/src/features/foo/bar/hooks/useX.ts',
		},
		{
			code: 'it("renders", () => { render(<MyView />); });',
			filename: '/app/mobile/src/features/foo/bar/MyScreen.test.tsx',
		},
		{
			code: 'export function Button() { return <Pressable />; }',
			filename: '/app/mobile/src/shared/components/ui/Button.tsx',
		},
	],
	invalid: [
		{
			code: 'export function MyView() { return <div>test</div>; }',
			filename: '/app/mobile/src/features/foo/bar/presenters/MyView.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function MyOrch() { return <MyView />; }',
			filename: '/app/mobile/src/features/foo/bar/orchestrators/MyOrch.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function MyView() { return <div>test</div>; }',
			filename: '/app/mobile/src/features/foo/components/bar/components/presenters/MyView.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function MyView() { return <div>test</div>; }',
			filename: '/app/mobile/src/features/foo/components/presenters/MyView.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function MyView() { return <div>test</div>; }',
			filename: '/app/mobile/src/features/foo/components/components/presenters/MyView.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function MyProvider() { return <Context.Provider value={{}} />; }',
			filename: '/app/mobile/src/features/foo/bar/context/MyProvider.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function RogueComponent() { return <><div>Rogue</div></>; }',
			filename: '/app/mobile/src/features/foo/bar/components/RogueComponent.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
		},
		{
			code: 'export function FloatingToast() { return <div>Toast</div>; }',
			filename: '/app/mobile/src/features/foo/feedback/FloatingToast.tsx',
			errors: [{ messageId: 'componentOutsideRoleDir' }],
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
