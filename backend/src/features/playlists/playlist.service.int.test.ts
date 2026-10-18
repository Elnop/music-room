import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { AddTrackDTO, CreatePlaylistDTO } from '@/features/playlists/playlist.types.js';

// Playlist CRUD, lists and member management against the local Supabase stack.
// The list filters (`or`, `cs` on arrays), array updates and the delete cascade
// live in PostgREST and Postgres, so they are only checked here. The permission
// matrix itself is unit-tested in permissions/playlist.permissions.test.ts.

const {
	notifyPlaylistUpdate,
	notifyPlaylistDetails,
	notifyPlaylistDeleted,
	revalidatePlaylistRoom,
} = vi.hoisted(() => ({
	notifyPlaylistUpdate: vi.fn(),
	notifyPlaylistDetails: vi.fn(),
	notifyPlaylistDeleted: vi.fn(),
	revalidatePlaylistRoom: vi.fn(),
}));
vi.mock('@/realtime/index.js', () => ({
	realtime: {
		notifyPlaylistUpdate,
		notifyPlaylistDetails,
		notifyPlaylistDeleted,
		revalidatePlaylistRoom,
	},
}));

const { PlaylistService } = await import('@/features/playlists/playlist.service.js');
const { CollaboratorService } =
	await import('@/features/playlists/services/collaborator.service.js');
const { ViewerService } = await import('@/features/playlists/services/viewer.service.js');
const { PlaylistTrackService } =
	await import('@/features/playlists/services/playlist-track.service.js');

const playlists = new PlaylistService();
const collaborators = new CollaboratorService();
const viewers = new ViewerService();
const tracks = new PlaylistTrackService();
const URI_PREFIX = `https://soundcloud.com/int-playlist/${randomUUID()}`;

let ownerId: string;
let collaboratorId: string;
let viewerId: string;
let strangerId: string;
let otherOwnerId: string;

const dto = (i: number): AddTrackDTO => ({
	trackUri: `${URI_PREFIX}/${i}`,
	title: `T${i}`,
	artist: 'A',
	durationMs: 1000,
});

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username: `int_${data.user.id.slice(0, 8)}` });
	if (profileError) throw profileError;
	return data.user.id;
}

/** Playlist owned by `ownerId`, with the collaborator and the viewer added through the services. */
async function createShared(
	visibility: 'public' | 'private',
	editMode: 'open' | 'restricted'
): Promise<string> {
	const { id } = await playlists.createPlaylist(ownerId, {
		name: `int-${randomUUID()}`,
		visibility,
		editMode,
	});
	await collaborators.addCollaborator(id, ownerId, collaboratorId);
	await viewers.addViewer(id, ownerId, viewerId);
	return id;
}

async function row(playlistId: string) {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.select('*')
		.eq('id', playlistId)
		.maybeSingle();
	if (error) throw error;
	return data;
}

async function trackRows(playlistId: string) {
	const { data, error } = await supabaseAdmin
		.from('playlist_tracks')
		.select('track_id')
		.eq('playlist_id', playlistId);
	if (error) throw error;
	return data;
}

async function rejection(promise: Promise<unknown>): Promise<AppError> {
	const error = await promise.then(
		() => null,
		(e: unknown) => e
	);
	expect(error).toBeInstanceOf(AppError);
	return error as AppError;
}

beforeAll(async () => {
	ownerId = await createUser();
	collaboratorId = await createUser();
	viewerId = await createUser();
	strangerId = await createUser();
	otherOwnerId = await createUser();
});

beforeEach(() => {
	notifyPlaylistUpdate.mockClear();
	notifyPlaylistDetails.mockClear();
	notifyPlaylistDeleted.mockClear();
	revalidatePlaylistRoom.mockClear();
});

afterAll(async () => {
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
	for (const id of [ownerId, collaboratorId, viewerId, strangerId, otherOwnerId]) {
		if (id) await supabaseAdmin.auth.admin.deleteUser(id); // cascades to playlists
	}
});

describe('PlaylistService CRUD', () => {
	it('creates a public, open, empty playlist by default', async () => {
		const input: CreatePlaylistDTO = { name: `int-${randomUUID()}` };
		const created = await playlists.createPlaylist(ownerId, input);
		expect(created).toMatchObject({
			name: input.name,
			ownerId,
			visibility: 'public',
			editMode: 'open',
			trackCount: 0,
			collaboratorIds: [],
			viewerIds: [],
		});
		expect(await row(created.id)).toMatchObject({ visibility: 'public', edit_mode: 'open' });
	});

	it('reads a private playlist for its members and refuses a stranger with 403', async () => {
		const id = await createShared('private', 'restricted');
		for (const user of [ownerId, collaboratorId, viewerId]) {
			const playlist = await playlists.getPlaylistById(id, user);
			expect(playlist).toMatchObject({ id, owner: { id: ownerId }, tracks: [] });
		}
		const error = await rejection(playlists.getPlaylistById(id, strangerId));
		expect(error).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
	});

	it('refuses a missing playlist with 404', async () => {
		const error = await rejection(playlists.getPlaylistById(randomUUID(), ownerId));
		expect(error).toMatchObject({ statusCode: 404, code: 'PLAYLIST_NOT_FOUND' });
	});

	it('lets the owner update the metadata, broadcasts it and revalidates the room', async () => {
		const id = await createShared('public', 'open');
		const updated = await playlists.updatePlaylist(id, ownerId, {
			name: 'renamed',
			description: 'new description',
			visibility: 'private',
			editMode: 'restricted',
		});
		expect(notifyPlaylistDetails).toHaveBeenCalledExactlyOnceWith({
			playlistId: id,
			name: 'renamed',
			description: 'new description',
			visibility: 'private',
			editMode: 'restricted',
		});
		expect(updated).toMatchObject({
			name: 'renamed',
			visibility: 'private',
			editMode: 'restricted',
		});
		expect(await row(id)).toMatchObject({
			name: 'renamed',
			visibility: 'private',
			edit_mode: 'restricted',
		});
		expect(revalidatePlaylistRoom).toHaveBeenCalledWith(id);
	});

	it('refuses update and delete by a collaborator with 403 and leaves the row unchanged', async () => {
		const id = await createShared('public', 'open');
		const before = await row(id);

		const update = await rejection(
			playlists.updatePlaylist(id, collaboratorId, { name: 'hijack' })
		);
		expect(update).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
		const remove = await rejection(playlists.deletePlaylist(id, collaboratorId));
		expect(remove).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });

		expect(await row(id)).toEqual(before);
		expect(revalidatePlaylistRoom).not.toHaveBeenCalled();
		expect(notifyPlaylistDetails).not.toHaveBeenCalled();
		expect(notifyPlaylistDeleted).not.toHaveBeenCalled();
	});

	it('deletes the playlist and its tracks, tells the room, then revalidates it', async () => {
		const id = await createShared('public', 'open');
		await tracks.addTrack(id, ownerId, dto(0));
		expect(await trackRows(id)).toHaveLength(1);

		await playlists.deletePlaylist(id, ownerId);

		expect(await row(id)).toBeNull();
		expect(await trackRows(id)).toEqual([]);
		expect(revalidatePlaylistRoom).toHaveBeenCalledWith(id);
		expect(notifyPlaylistDeleted).toHaveBeenCalledExactlyOnceWith({ playlistId: id });
		// The broadcast must reach the room before its sockets are evicted.
		expect(notifyPlaylistDeleted.mock.invocationCallOrder[0]).toBeLessThan(
			revalidatePlaylistRoom.mock.invocationCallOrder[0]
		);
	});
});

describe('PlaylistService lists', () => {
	it('getUserPlaylists includes the playlist for owner, collaborator and viewer only', async () => {
		const id = await createShared('private', 'restricted');
		for (const user of [ownerId, collaboratorId, viewerId]) {
			const ids = (await playlists.getUserPlaylists(user)).map(p => p.id);
			expect(ids, user).toContain(id);
		}
		const strangerIds = (await playlists.getUserPlaylists(strangerId)).map(p => p.id);
		expect(strangerIds).not.toContain(id);
	});

	it("getPublicPlaylists shows other users' public playlists but not the caller's own", async () => {
		const own = await playlists.createPlaylist(ownerId, { name: `int-${randomUUID()}` });
		const otherPrivate = await playlists.createPlaylist(otherOwnerId, {
			name: `int-${randomUUID()}`,
			visibility: 'private',
		});
		const other = await playlists.createPlaylist(otherOwnerId, { name: `int-${randomUUID()}` });

		const ids = (await playlists.getPublicPlaylists(ownerId)).map(p => p.id);
		expect(ids).toContain(other.id);
		expect(ids).not.toContain(own.id);
		expect(ids).not.toContain(otherPrivate.id);
	});

	it('getPlaylistsByUser hides private playlists from a stranger and an anonymous caller', async () => {
		const privateId = await createShared('private', 'open');
		const publicPlaylist = await playlists.createPlaylist(ownerId, { name: `int-${randomUUID()}` });

		for (const user of [collaboratorId, viewerId]) {
			const ids = (await playlists.getPlaylistsByUser(ownerId, user)).map(p => p.id);
			expect(ids, user).toEqual(expect.arrayContaining([privateId, publicPlaylist.id]));
		}
		for (const user of [strangerId, undefined]) {
			const ids = (await playlists.getPlaylistsByUser(ownerId, user)).map(p => p.id);
			expect(ids, String(user)).toContain(publicPlaylist.id);
			expect(ids, String(user)).not.toContain(privateId);
		}
	});
});

describe('CollaboratorService', () => {
	it('adds a collaborator, refuses a second add with 409, then removes it', async () => {
		const { id } = await playlists.createPlaylist(ownerId, { name: `int-${randomUUID()}` });
		await collaborators.addCollaborator(id, ownerId, collaboratorId);
		expect((await row(id))?.collaborator_ids).toEqual([collaboratorId]);

		const again = await rejection(collaborators.addCollaborator(id, ownerId, collaboratorId));
		expect(again).toMatchObject({ statusCode: 409, code: 'ALREADY_COLLABORATOR' });

		await collaborators.removeCollaborator(id, ownerId, collaboratorId);
		expect((await row(id))?.collaborator_ids).toEqual([]);
		expect(revalidatePlaylistRoom).toHaveBeenCalledWith(id);
	});

	it('refuses an unknown user with 404', async () => {
		const { id } = await playlists.createPlaylist(ownerId, { name: `int-${randomUUID()}` });
		const error = await rejection(collaborators.addCollaborator(id, ownerId, randomUUID()));
		expect(error).toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
	});

	it('refuses add and remove by a non-owner with 403', async () => {
		const id = await createShared('public', 'open');
		const add = await rejection(collaborators.addCollaborator(id, collaboratorId, strangerId));
		expect(add).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
		const remove = await rejection(
			collaborators.removeCollaborator(id, collaboratorId, collaboratorId)
		);
		expect(remove).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
		expect((await row(id))?.collaborator_ids).toEqual([collaboratorId]);
	});
});

describe('ViewerService', () => {
	it('refuses the owner with 400, a collaborator and a second add with 409', async () => {
		const id = await createShared('private', 'restricted');

		const owner = await rejection(viewers.addViewer(id, ownerId, ownerId));
		expect(owner).toMatchObject({ statusCode: 400, code: 'OWNER_CANNOT_BE_VIEWER' });
		const collaborator = await rejection(viewers.addViewer(id, ownerId, collaboratorId));
		expect(collaborator).toMatchObject({ statusCode: 409, code: 'ALREADY_COLLABORATOR' });
		const again = await rejection(viewers.addViewer(id, ownerId, viewerId));
		expect(again).toMatchObject({ statusCode: 409, code: 'ALREADY_VIEWER' });

		expect((await row(id))?.viewer_ids).toEqual([viewerId]);
	});

	it('lists viewers with their profile, then removes one', async () => {
		const id = await createShared('private', 'restricted');
		await expect(viewers.getViewers(id, ownerId)).resolves.toEqual([
			expect.objectContaining({ id: viewerId, username: `int_${viewerId.slice(0, 8)}` }),
		]);

		await viewers.removeViewer(id, ownerId, viewerId);
		expect((await row(id))?.viewer_ids).toEqual([]);
		expect(revalidatePlaylistRoom).toHaveBeenCalledWith(id);
		await expect(viewers.getViewers(id, ownerId)).resolves.toEqual([]);
	});

	it('refuses viewer management by a non-owner with 403', async () => {
		const id = await createShared('private', 'restricted');
		const add = await rejection(viewers.addViewer(id, collaboratorId, strangerId));
		expect(add).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
		expect((await row(id))?.viewer_ids).toEqual([viewerId]);
		const list = await rejection(viewers.getViewers(id, viewerId));
		expect(list).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
	});
});

describe('viewer edit rights (CAP-3)', () => {
	it.each(['private', 'public'] as const)(
		'a viewer cannot add a track to a %s restricted playlist, but can once it is open',
		async visibility => {
			const id = await createShared(visibility, 'restricted');

			const error = await rejection(tracks.addTrack(id, viewerId, dto(1)));
			expect(error).toMatchObject({ statusCode: 403, code: 'PLAYLIST_ACCESS_DENIED' });
			expect(await trackRows(id)).toEqual([]);
			expect(notifyPlaylistUpdate).not.toHaveBeenCalled();

			await playlists.updatePlaylist(id, ownerId, { editMode: 'open' });
			const { track } = await tracks.addTrack(id, viewerId, dto(1));
			expect(await trackRows(id)).toEqual([{ track_id: track.id }]);
		}
	);
});
