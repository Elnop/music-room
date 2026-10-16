/**
 * zumik:// share links (GitHub #321).
 *
 * - zumik://playlist/<uuid> opens the playlist detail (Playlists tab).
 * - zumik://user/<uuid> opens a user's profile (Friends tab).
 *
 * Any other path, or an id that is not a UUID, is ignored. A link received while
 * signed out is kept as the pending link and opened after sign-in, because the
 * app navigator is not mounted yet (see RootNavigator).
 */

import {
	getActionFromState,
	getStateFromPath as defaultGetStateFromPath,
} from '@react-navigation/native';
import type { LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import type { AppTabsParamList } from '@/navigation/AppNavigator';

export const LINK_PREFIX = 'zumik://';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SHARE_PATH = new RegExp(`^/?(playlist|user)/${UUID}/?(\\?.*)?$`, 'i');

export const playlistLink = (id: string): string => `${LINK_PREFIX}playlist/${id}`;

export const userLink = (id: string): string => `${LINK_PREFIX}user/${id}`;

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

/**
 * The NavigationContainer's linking options. `isSignedIn` is read for each link:
 * signed out, the link is stored as pending instead of being applied to the
 * auth screens.
 */
export function createLinking(isSignedIn: () => boolean): LinkingOptions<AppTabsParamList> {
	return {
		prefixes: [LINK_PREFIX],
		config: linkingConfig,
		getStateFromPath: (path, options) => {
			const state = stateFromSharePath(path, options);
			if (!state) return undefined;
			if (!isSignedIn()) {
				pendingPath = path;
				return undefined;
			}
			return state;
		},
	};
}

/**
 * Opens the link kept while signed out, once the app navigator is mounted.
 * Returns true when a link was opened.
 */
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
		console.warn('[linking] Could not open the pending link:', error);
		return false;
	}
}
