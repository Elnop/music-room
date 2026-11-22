import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useCachedPlaylist } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import {
	memberIdsOf,
	sharingModeOf,
} from '@/features/playlists/features/editor/features/sharing/lib/sharingMode';
import { useSharingMembers } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingMembers';
import { useSharingSettings } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingSettings';
import { useUserSearch } from '@/features/playlists/features/editor/features/sharing/hooks/useUserSearch';
import type { PlaylistSharing } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

export function usePlaylistSharing(id: string): PlaylistSharing {
	const playlist = useCachedPlaylist(id);
	const members = useSharingMembers(id);
	const mode = sharingModeOf(playlist);
	const settings = useSharingSettings(id, mode, playlist !== undefined);
	const userSearch = useUserSearch(memberIdsOf(playlist, members.members));
	useRefetchOnFocus(members.refetch);

	return {
		mode,
		isInfoOnly: !mode.isPrivate && !mode.isEditRestricted,
		members,
		settings,
		userSearch,
		addUser: (user) => {
			if (members.busy) return;
			userSearch.search.clear();
			members.add(user, mode.isPrivate, !mode.isEditRestricted);
		},
		removeUser: (userId) => members.remove(userId, mode.isPrivate),
		bottomPadding: useBottomPadding(),
	};
}
