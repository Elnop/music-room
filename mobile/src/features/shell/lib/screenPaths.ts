import type { InitialState } from '@react-navigation/native';
import { SCREEN_PATHS } from '@/features/shell/configs/screenPathsConfig';
import type {
	AppTab,
	NestedParams,
	RouteNode,
	ScreenPath,
	ScreenPathMatch,
	StateNode,
} from '@/features/shell/types/screenPathTypes';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const TAB_SCREENS: Record<AppTab, string> = {
	HomeTab: 'Home',
	PlaylistsTab: 'Playlists',
	SearchTab: 'Search',
	FriendsTab: 'Friends',
	ProfileTab: 'Profile',
};

const MATCHERS = SCREEN_PATHS.map(entry => ({
	entry,
	regex: new RegExp(`^${entry.path.replace(':id', `(${UUID})`)}$`, 'iu'),
}));

export function matchScreenPath(path: string, signedIn?: boolean): ScreenPathMatch | undefined {
	const bare = path.split(/[?#]/u)[0].replaceAll(/^\/+|\/+$/gu, '');
	const matches = MATCHERS.flatMap(({ entry, regex }) => {
		const found = regex.exec(bare);
		return found ? [{ entry, id: found[1] ?? '' }] : [];
	});
	return (
		matches.find(match => signedIn === undefined || Boolean(match.entry.tab) === signedIn) ??
		matches[0]
	);
}

export function stateFromMatch({ entry, id }: ScreenPathMatch): InitialState {
	const routes = entry.routes(id);
	const stack = { index: routes.length - 1, routes };
	return entry.tab ? { routes: [{ name: entry.tab, state: stack }] } : stack;
}

function focusedRoute(state: StateNode): RouteNode | undefined {
	let route = state.routes[state.index ?? state.routes.length - 1];
	for (;;) {
		if (route?.state) {
			route = route.state.routes[route.state.index ?? route.state.routes.length - 1];
		} else if (route && (route.params as NestedParams | undefined)?.screen) {
			const nested = route.params as NestedParams;
			route = { name: nested.screen as string, params: nested.params };
		} else return route;
	}
}

function screenPathFor(name: string, params: Record<string, unknown>): ScreenPath | undefined {
	const candidates = SCREEN_PATHS.filter(candidate => candidate.screen === name);
	return (
		candidates.find(candidate => candidate.param && typeof params[candidate.param] === 'string') ??
		candidates.find(candidate => !candidate.param)
	);
}

export function pathFromState(state: StateNode): string {
	const route = focusedRoute(state);
	if (!route) return '/';
	const params = (route.params ?? {}) as Record<string, unknown>;
	const entry = screenPathFor(TAB_SCREENS[route.name as AppTab] ?? route.name, params);
	if (!entry) return '/';
	const id = entry.param ? String(params[entry.param]) : '';
	return `/${entry.path.replace(':id', id)}`;
}
