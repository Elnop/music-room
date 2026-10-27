// Android opens only zumik://playlist/<uuid> and zumik://user/<uuid>; a browser, every screen path of
// screenPaths.ts. A link received signed out is kept pending until sign-in, since the app navigator is not mounted yet.

import { getActionFromState } from '@react-navigation/native';
import type { LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppTabsParamList } from './AppNavigator';
import { logger } from '@/shared/utils/logger';
import { LINK_PREFIX } from '@/shared/utils/shareLinks';
import { stripBasePath, webBasePath } from './webBasePath';
import {
	matchScreenPath,
	pathFromState,
	stateFromMatch,
	type ScreenPathMatch,
} from './screenPaths';

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

/** The screen of a path this platform opens: any screen in a browser, a share link elsewhere. */
function matchLink(path: string, signedIn?: boolean): ScreenPathMatch | undefined {
	const match = matchScreenPath(path, signedIn);
	if (!match || (Platform.OS !== 'web' && !match.entry.shared)) return undefined;
	return match;
}

/** The navigation state of a link path once signed in, or undefined when this platform does not open it. */
export function stateFromLinkPath(path: string) {
	const match = matchLink(path, true);
	return match && stateFromMatch(match);
}

/** In a browser, the address bar shows the screen paths under the app's origin and base path. */
function webLinking(): Partial<LinkingOptions<AppTabsParamList>> {
	const origin = (globalThis as { location?: { origin?: string } }).location?.origin;
	if (Platform.OS !== 'web' || !origin) return {};
	const base = webBasePath();
	return {
		prefixes: [LINK_PREFIX, `${origin}${base}`],
		getPathFromState: state => `${base}${pathFromState(state)}`,
	};
}

/** `isSignedIn` is read per link: signed out, an app screen is kept pending; signed in, a signed-out screen opens the home. */
export function createLinking(isSignedIn: () => boolean): LinkingOptions<AppTabsParamList> {
	return {
		prefixes: [LINK_PREFIX],
		// The browser hands over its full path, base path included
		getStateFromPath: fullPath => {
			const path = stripBasePath(fullPath);
			const signedIn = isSignedIn();
			const match = matchLink(path, signedIn);
			if (!match) return undefined;
			const signedOutScreen = !match.entry.tab;
			if (signedIn === signedOutScreen) {
				// The home screen is where sign-in lands anyway
				if (!signedOutScreen && match.entry.path !== '') pendingPath = path;
				return undefined;
			}
			return stateFromMatch(match);
		},
		...webLinking(),
	};
}

/** Call once the app navigator is mounted; returns true when a link was opened. */
export function openPendingLink(navigation: NavigationContainerRef<AppTabsParamList>): boolean {
	if (!navigation.isReady()) return false;
	const path = takePendingLink();
	if (!path) return false;
	const state = stateFromLinkPath(path);
	if (!state) return false;
	try {
		const action = getActionFromState(state);
		if (action) navigation.dispatch(action);
		else navigation.resetRoot(state);
		return true;
	} catch (error) {
		logger.warn('[linking] Could not open the pending link:', error);
		return false;
	}
}
