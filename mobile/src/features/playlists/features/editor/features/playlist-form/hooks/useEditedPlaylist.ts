import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';

type EditedPlaylist = Pick<Playlist, 'name' | 'description'>;

export function useEditedPlaylist(editedId: string | undefined): EditedPlaylist | undefined {
	const client = useQueryClient();
	const [edited] = useState<EditedPlaylist | undefined>(() =>
		editedId === undefined
			? undefined
			: (client.getQueryData<Playlist>(queryKeys.playlists.detail(editedId)) ??
				client
					.getQueryData<Playlist[]>(queryKeys.playlists.list())
					?.find((p) => p.id === editedId)),
	);
	return edited;
}
