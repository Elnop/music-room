import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useCachedPlaylist } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import type { UserSummary } from '@/features/playlists/shared/playlist/lib/types';
import type { SharingMode } from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import { useSharingMembers } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingMembers';
import type { SharingMembers } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingMembers';
import { useSharingSettings } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingSettings';
import type { SharingSettings } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingSettings';
import { useUserSearch } from '@/features/playlists/features/editor/features/sharing/hooks/useUserSearch';
import type { UserSearch } from '@/features/playlists/features/editor/features/sharing/hooks/useUserSearch';

export interface PlaylistSharing {
	mode: SharingMode;
	isInfoOnly: boolean;
	members: SharingMembers;
	settings: SharingSettings;
	userSearch: UserSearch;
	addUser: (user: UserSummary) => void;
	removeUser: (userId: string) => Promise<void>;
	bottomPadding: number;
}

export function usePlaylistSharing(id: string): PlaylistSharing {
	const playlist = useCachedPlaylist(id);
	const members = useSharingMembers(id);
	const mode = {
		isPrivate: playlist?.visibility === 'private',
		isEditRestricted: playlist?.editMode === 'restricted',
	};
	const settings = useSharingSettings(id, mode, playlist !== undefined);
	const userSearch = useUserSearch([
		...(playlist ? [playlist.ownerId] : []),
		...members.members.map(member => member.id),
	]);
	useRefetchOnFocus(members.refetch);

	return {
		mode,
		isInfoOnly: !mode.isPrivate && !mode.isEditRestricted,
		members,
		settings,
		userSearch,
		addUser: user => {
			if (members.busy) return;
			userSearch.search.clear();
			members.add(user, mode.isPrivate, !mode.isEditRestricted);
		},
		removeUser: userId => members.remove(userId, mode.isPrivate),
		bottomPadding: useBottomPadding(),
	};
}
