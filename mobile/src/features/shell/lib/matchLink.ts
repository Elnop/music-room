import { Platform } from 'react-native';
import { matchScreenPath } from '@/features/shell/lib/screenPaths';
import type { ScreenPathMatch } from '@/features/shell/types/screenPathTypes';

export function matchLink(path: string, signedIn?: boolean): ScreenPathMatch | undefined {
	const match = matchScreenPath(path, signedIn);
	if (!match || (Platform.OS !== 'web' && !match.entry.isShareLink)) return undefined;
	return match;
}
