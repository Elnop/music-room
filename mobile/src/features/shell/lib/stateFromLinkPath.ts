import { matchLink } from '@/features/shell/lib/matchLink';
import { stateFromMatch } from '@/features/shell/lib/screenPaths';

export function stateFromLinkPath(path: string) {
	const match = matchLink(path, true);
	return match && stateFromMatch(match);
}
