import type { SharingMode } from '@/features/playlists/features/editor/features/sharing/sharingTypes';
import type {
	PlaylistMember,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';

export function sharingModeOf(playlist: PlaylistWithTracks | undefined): SharingMode {
	return {
		isPrivate: playlist?.visibility === 'private',
		isEditRestricted: playlist?.editMode === 'restricted',
	};
}

export function memberIdsOf(
	playlist: PlaylistWithTracks | undefined,
	members: PlaylistMember[],
): string[] {
	return [...(playlist ? [playlist.ownerId] : []), ...members.map((member) => member.id)];
}
