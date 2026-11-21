import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { logger } from '@/shared/logging/logger';
import * as membersApi from '@/features/playlists/features/editor/features/sharing/lib/membersApi';
import * as peopleApi from '@/features/playlists/shared/playlist/lib/peopleApi';
import { refreshPlaylist } from '@/features/playlists/shared/playlist/lib/playlistCache';
import type {
	PlaylistMember,
	UserSummary,
} from '@/features/playlists/shared/playlist/playlistTypes';

export function toMember(user: UserSummary, canEdit: boolean): PlaylistMember {
	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
		canEdit,
	};
}

export async function loadMembers(client: QueryClient, id: string): Promise<PlaylistMember[]> {
	const playlist = await refreshPlaylist(client, id);
	try {
		const viewers = await membersApi.getViewers(id);
		const editors = await Promise.all(playlist.collaboratorIds.map(peopleApi.getUserProfile));
		const members = [
			...editors.map(e => toMember(e, true)),
			...viewers.map(v => toMember(v, false)),
		];
		return members.filter((member, index) => members.findIndex(m => m.id === member.id) === index);
	} catch (error) {
		logger.error('[PlaylistSharing] Failed to load members:', error);
		return [];
	}
}

export function updateMembers(
	client: QueryClient,
	id: string,
	update: (list: PlaylistMember[]) => PlaylistMember[]
): void {
	client.setQueryData<PlaylistMember[]>(queryKeys.playlists.members(id), list =>
		update(list ?? [])
	);
}
