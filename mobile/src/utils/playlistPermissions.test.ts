import { canEditPlaylist, type PlaylistEditFields } from '@/utils/playlistPermissions';

const playlist = (overrides: Partial<PlaylistEditFields> = {}): PlaylistEditFields => ({
	ownerId: 'owner',
	collaboratorIds: [],
	viewerIds: [],
	visibility: 'private',
	editMode: 'restricted',
	...overrides,
});

describe('canEditPlaylist', () => {
	it('refuses without a user or a playlist', () => {
		expect(canEditPlaylist(null, playlist())).toBe(false);
		expect(canEditPlaylist(undefined, playlist())).toBe(false);
		expect(canEditPlaylist('owner', null)).toBe(false);
	});

	it('lets the owner and a collaborator edit a restricted private playlist', () => {
		expect(canEditPlaylist('owner', playlist())).toBe(true);
		expect(canEditPlaylist('c', playlist({ collaboratorIds: ['c'] }))).toBe(true);
	});

	it('refuses anyone else on a restricted playlist, even public or invited', () => {
		expect(canEditPlaylist('x', playlist({ visibility: 'public' }))).toBe(false);
		expect(canEditPlaylist('v', playlist({ viewerIds: ['v'] }))).toBe(false);
	});

	it('lets anyone edit an open public playlist', () => {
		expect(canEditPlaylist('x', playlist({ editMode: 'open', visibility: 'public' }))).toBe(true);
	});

	it('lets only invited viewers edit an open private playlist', () => {
		const open = playlist({ editMode: 'open', viewerIds: ['v'] });
		expect(canEditPlaylist('v', open)).toBe(true);
		expect(canEditPlaylist('x', open)).toBe(false);
	});
});
