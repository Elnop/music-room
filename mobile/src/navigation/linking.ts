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

let pendingPath: string | null = null;

export function takePendingLink(): string | null {
	const path = pendingPath;
	pendingPath = null;
	return path;
}

export function clearPendingLink(): void {
	pendingPath = null;
}

function matchLink(path: string, signedIn?: boolean): ScreenPathMatch | undefined {
	const match = matchScreenPath(path, signedIn);
	if (!match || (Platform.OS !== 'web' && !match.entry.isShareLink)) return undefined;
	return match;
}

export function stateFromLinkPath(path: string) {
	const match = matchLink(path, true);
	return match && stateFromMatch(match);
}

function webLinking(): Partial<LinkingOptions<AppTabsParamList>> {
	const origin = (globalThis as { location?: { origin?: string } }).location?.origin;
	if (Platform.OS !== 'web' || !origin) return {};
	const base = webBasePath();
	return {
		prefixes: [LINK_PREFIX, `${origin}${base}`],
		getPathFromState: state => `${base}${pathFromState(state)}`,
	};
}

/** `isSignedIn` is read per link: an app screen opened signed out waits for sign-in. */
export function createLinking(isSignedIn: () => boolean): LinkingOptions<AppTabsParamList> {
	return {
		prefixes: [LINK_PREFIX],
		getStateFromPath: fullPath => {
			const path = stripBasePath(fullPath);
			const signedIn = isSignedIn();
			const match = matchLink(path, signedIn);
			if (!match) return undefined;
			const isAppScreen = Boolean(match.entry.tab);
			if (isAppScreen !== signedIn) {
				// Sign-in lands on the home screen anyway.
				if (isAppScreen && match.entry.path !== '') pendingPath = path;
				return undefined;
			}
			return stateFromMatch(match);
		},
		...webLinking(),
	};
}

/** Call once the app navigator is mounted. */
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
