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
		friends: () => [...queryKeys.playlists.all, 'friends'] as const,
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
		recommendations: () => [...queryKeys.friends.all, 'recommendations'] as const,
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
	subscription: {
		all: ['subscription'] as const,
		plan: () => [...queryKeys.subscription.all, 'plan'] as const,
	},
	events: {
		all: ['events'] as const,
		list: () => [...queryKeys.events.all, 'list'] as const,
		detail: (eventId: string) => [...queryKeys.events.all, 'detail', eventId] as const,
		playlistChoices: (userId: string) =>
			[...queryKeys.events.all, 'playlistChoices', userId] as const,
	},
	search: {
		all: ['search'] as const,
		tracks: (query: string) => [...queryKeys.search.all, 'tracks', query] as const,
	},
} as const;
