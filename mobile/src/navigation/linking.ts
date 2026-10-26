// Only zumik://playlist/<uuid> and zumik://user/<uuid> are handled (and the same paths of the web
// app's origin and base path). A link received signed out is kept pending until sign-in, since the app navigator is not mounted yet.

import {
	getActionFromState,
	getStateFromPath as defaultGetStateFromPath,
} from '@react-navigation/native';
import type { LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppTabsParamList } from './AppNavigator';
import { logger } from '@/shared/utils/logger';
import { LINK_PREFIX } from '@/shared/utils/shareLinks';
import { stripBasePath, webBasePath } from './webBasePath';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SHARE_PATH = new RegExp(`^/?(playlist|user)/${UUID}/?(\\?.*)?$`, 'i');

/** A link received while signed out, opened once the app navigator is mounted. */
let pendingPath: string | null = null;

/** Returns the pending link path, if any, and forgets it. */
export function takePendingLink(): string | null {
	const path = pendingPath;
	pendingPath = null;
	return path;
}

export function clearPendingLink(): void {
	pendingPath = null;
}

const linkingConfig = {
	screens: {
		PlaylistsTab: {
			initialRouteName: 'Playlists',
			screens: { PlaylistDetail: 'playlist/:id' },
		},
		FriendsTab: {
			initialRouteName: 'Friends',
			screens: { UserProfile: 'user/:userId' },
		},
	},
} satisfies LinkingOptions<AppTabsParamList>['config'];

type Options = Parameters<typeof defaultGetStateFromPath>[1];

/** The navigation state of a share link path, or undefined when it is not one. */
export function stateFromSharePath(path: string, options: Options = linkingConfig) {
	if (!SHARE_PATH.test(path)) return undefined;
	return defaultGetStateFromPath(path, options);
}

interface RouteNode {
	name: string;
	params?: object;
	state?: StateNode;
}

interface StateNode {
	index?: number;
	routes: readonly RouteNode[];
}

/** The browser path of a navigation state: a share link for a playlist or a profile, the root otherwise. */
export function sharePathFromState(state: StateNode): string {
	let route = state.routes[state.index ?? state.routes.length - 1];
	while (route?.state)
		route = route.state.routes[route.state.index ?? route.state.routes.length - 1];
	const params = (route?.params ?? {}) as { id?: string; userId?: string };
	if (route?.name === 'PlaylistDetail' && params.id) return `/playlist/${params.id}`;
	if (route?.name === 'UserProfile' && params.userId) return `/user/${params.userId}`;
	return '/';
}

/** In a browser, the address bar shows the share paths under the app's origin and base path. */
function webLinking(): Partial<LinkingOptions<AppTabsParamList>> {
	const origin = (globalThis as { location?: { origin?: string } }).location?.origin;
	if (Platform.OS !== 'web' || !origin) return {};
	const base = webBasePath();
	return {
		prefixes: [LINK_PREFIX, `${origin}${base}`],
		getPathFromState: state => `${base}${sharePathFromState(state)}`,
	};
}

/** `isSignedIn` is read per link: signed out, the link is stored as pending, not applied to the auth screens. */
export function createLinking(isSignedIn: () => boolean): LinkingOptions<AppTabsParamList> {
	return {
		prefixes: [LINK_PREFIX],
		config: linkingConfig,
		// The browser hands over its full path, base path included
		getStateFromPath: (fullPath, options) => {
			const path = stripBasePath(fullPath);
			const state = stateFromSharePath(path, options);
			if (!state) return undefined;
			if (!isSignedIn()) {
				pendingPath = path;
				return undefined;
			}
			return state;
		},
		...webLinking(),
	};
}

/** Call once the app navigator is mounted; returns true when a link was opened. */
export function openPendingLink(navigation: NavigationContainerRef<AppTabsParamList>): boolean {
	if (!navigation.isReady()) return false;
	const path = takePendingLink();
	if (!path) return false;
	const state = stateFromSharePath(path);
	if (!state) return false;
	try {
		const action = getActionFromState(state, linkingConfig);
		if (action) navigation.dispatch(action);
		else navigation.resetRoot(state);
		return true;
	} catch (error) {
		logger.warn('[linking] Could not open the pending link:', error);
		return false;
	}
}
