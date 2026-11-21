import { queryKeys } from '@/shared/query-keys/queryKeys';

export const playlistEventKeys = {
	detail: (event: { playlistId: string }) => queryKeys.playlists.detail(event.playlistId),
	list: () => queryKeys.playlists.list(),
};
