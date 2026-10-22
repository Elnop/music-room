/**
 * Query-key factory: every TanStack query key is built here, one entry per
 * domain, so a hook and the socket bridge that invalidates it agree on the
 * key. Keys nest: `queryKeys.playlists.all` is a prefix of every playlist key,
 * so invalidating it refreshes all of them.
 */
export const queryKeys = {
	playlists: {
		all: ['playlists'] as const,
		list: () => [...queryKeys.playlists.all, 'list'] as const,
		detail: (playlistId: string) => [...queryKeys.playlists.all, 'detail', playlistId] as const,
	},
	queue: {
		all: ['queue'] as const,
		room: (roomId: string) => [...queryKeys.queue.all, 'room', roomId] as const,
	},
	friends: {
		all: ['friends'] as const,
		list: () => [...queryKeys.friends.all, 'list'] as const,
		search: (query: string) => [...queryKeys.friends.all, 'search', query] as const,
	},
	profile: {
		all: ['profile'] as const,
		me: () => [...queryKeys.profile.all, 'me'] as const,
		user: (userId: string) => [...queryKeys.profile.all, 'user', userId] as const,
	},
	devices: {
		all: ['devices'] as const,
		list: () => [...queryKeys.devices.all, 'list'] as const,
	},
	search: {
		all: ['search'] as const,
		tracks: (query: string) => [...queryKeys.search.all, 'tracks', query] as const,
	},
} as const;
