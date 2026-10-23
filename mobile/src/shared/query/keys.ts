// Every query key is built here so a hook and the socket bridge that invalidates it agree.
// Keys nest: invalidating `queryKeys.playlists.all` refreshes every playlist key.
export const queryKeys = {
	auth: {
		all: ['auth'] as const,
		/** Per user, so a next account never reads the previous one's list. */
		providers: (userId: string) => [...queryKeys.auth.all, 'providers', userId] as const,
	},
	playlists: {
		all: ['playlists'] as const,
		list: () => [...queryKeys.playlists.all, 'list'] as const,
		detail: (playlistId: string) => [...queryKeys.playlists.all, 'detail', playlistId] as const,
		public: () => [...queryKeys.playlists.all, 'public'] as const,
		/** The public playlists of the user's friends. */
		friends: () => [...queryKeys.playlists.all, 'friends'] as const,
		/** Collaborators and viewers of a playlist. */
		members: (playlistId: string) => [...queryKeys.playlists.all, 'members', playlistId] as const,
	},
	queue: {
		all: ['queue'] as const,
		room: (roomId: string) => [...queryKeys.queue.all, 'room', roomId] as const,
		detail: (ownerId?: string | null) =>
			ownerId
				? ([...queryKeys.queue.all, 'owner', ownerId] as const)
				: ([...queryKeys.queue.all, 'me'] as const),
	},
	friends: {
		all: ['friends'] as const,
		list: () => [...queryKeys.friends.all, 'list'] as const,
		search: (query: string) => [...queryKeys.friends.all, 'search', query] as const,
		status: (userId: string) => [...queryKeys.friends.all, 'status', userId] as const,
		stats: () => [...queryKeys.friends.all, 'stats'] as const,
		permissions: () => [...queryKeys.friends.all, 'permissions'] as const,
	},
	profile: {
		all: ['profile'] as const,
		me: () => [...queryKeys.profile.all, 'me'] as const,
		user: (userId: string) => [...queryKeys.profile.all, 'user', userId] as const,
		privacy: () => [...queryKeys.profile.all, 'privacy'] as const,
		musicPreferences: () => [...queryKeys.profile.all, 'musicPreferences'] as const,
	},
	devices: {
		all: ['devices'] as const,
		list: () => [...queryKeys.devices.all, 'list'] as const,
		picker: () => [...queryKeys.devices.all, 'picker'] as const,
	},
	search: {
		all: ['search'] as const,
		tracks: (query: string) => [...queryKeys.search.all, 'tracks', query] as const,
	},
} as const;
