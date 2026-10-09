import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { AddTrackDTO } from '@/features/playlists/playlist.types.js';

// PlaylistTrackService and the playlist fetch on top of migration 016, against the
// local Supabase stack (doc/PLAYLIST_CONCURRENCY.md). The RPCs themselves are
// covered by track-operations.int.test.ts; this file checks the service layer:
// permissions, added_by, result shapes, error mapping and concurrent calls.

const { notifyPlaylistUpdate } = vi.hoisted(() => ({ notifyPlaylistUpdate: vi.fn() }));
vi.mock('@/realtime/index.js', () => ({
	realtime: { notifyPlaylistUpdate, revalidatePlaylistRoom: vi.fn() },
}));

const { PlaylistTrackService } =
	await import('@/features/playlists/services/playlist-track.service.js');
const { PlaylistService } = await import('@/features/playlists/playlist.service.js');

const service = new PlaylistTrackService();
const playlists = new PlaylistService();
const URI_PREFIX = `https://soundcloud.com/int-service/${randomUUID()}`;

let ownerId: string;
let strangerId: string;
let playlistId: string;
let trackIds: string[];

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

async function createPlaylist(editMode: 'open' | 'restricted'): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.insert({ name: 'int', owner_id: ownerId, visibility: 'private', edit_mode: editMode })
		.select('id')
		.single();
	if (error) throw error;
	return data.id;
}

async function rows() {
	const { data, error } = await supabaseAdmin
		.from('playlist_tracks')
		.select('track_id, rank, added_by')
		.eq('playlist_id', playlistId)
		.order('rank');
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
	strangerId = await createUser();
});

beforeEach(async () => {
	notifyPlaylistUpdate.mockClear();
	playlistId = await createPlaylist('restricted');
	trackIds = [];
	for (let i = 0; i < 4; i++) {
		const { track } = await service.addTrack(playlistId, ownerId, dto(i));
		trackIds.push(track.id);
	}
});

afterAll(async () => {
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
	for (const id of [ownerId, strangerId]) {
		if (id) await supabaseAdmin.auth.admin.deleteUser(id); // cascades to playlists
	}
});

describe('PlaylistTrackService on atomic operations', () => {
	it('adds a track and returns it with its rank, adder and the new version', async () => {
		const result = await service.addTrack(playlistId, ownerId, dto(4));
		expect(result).toMatchObject({
			tracksVersion: 5,
			rebalanced: false,
			track: { trackUri: dto(4).trackUri, addedBy: ownerId },
		});
		expect(typeof result.track.rank).toBe('string');
		expect(typeof result.track.addedAt).toBe('string');
		const last = (await rows()).at(-1);
		expect(last).toEqual({ track_id: result.track.id, rank: result.track.rank, added_by: ownerId });
		expect(notifyPlaylistUpdate).toHaveBeenLastCalledWith({
			playlistId,
			tracksVersion: 5,
			rebalanced: false,
			event: 'track_added',
			track: result.track,
		});
	});

	it('records no adder in open mode', async () => {
		playlistId = await createPlaylist('open');
		const result = await service.addTrack(playlistId, ownerId, dto(0));
		expect(result.track.addedBy).toBeNull();
		expect((await rows())[0].added_by).toBeNull();
	});

	it('refuses a duplicate add with 409 TRACK_DUPLICATE', async () => {
		const error = await rejection(service.addTrack(playlistId, ownerId, dto(0)));
		expect(error).toMatchObject({ statusCode: 409, code: 'TRACK_DUPLICATE' });
	});

	it('refuses every operation to a user without the edit right', async () => {
		const calls = [
			() => service.addTrack(playlistId, strangerId, dto(4)),
			() => service.removeTrack(playlistId, strangerId, trackIds[0]),
			() =>
				service.moveTrack(playlistId, strangerId, trackIds[0], {
					afterRank: null,
					expectedVersion: 4,
				}),
		];
		for (const call of calls) {
			expect(await rejection(call())).toMatchObject({ statusCode: 403 });
		}
		expect(await rows()).toHaveLength(4);
	});

	it('removes a track without renumbering, then 404 TRACK_NOT_IN_PLAYLIST', async () => {
		const before = await rows();
		await expect(service.removeTrack(playlistId, ownerId, trackIds[1])).resolves.toEqual({
			tracksVersion: 5,
		});
		expect(await rows()).toEqual(before.filter(r => r.track_id !== trackIds[1]));
		expect(notifyPlaylistUpdate).toHaveBeenLastCalledWith({
			playlistId,
			tracksVersion: 5,
			rebalanced: false,
			event: 'track_removed',
			trackId: trackIds[1],
		});

		const error = await rejection(service.removeTrack(playlistId, ownerId, trackIds[1]));
		expect(error).toMatchObject({ statusCode: 404, code: 'TRACK_NOT_IN_PLAYLIST' });
	});

	it('moves a track, keeps added_by, and refuses the same stale move with 409', async () => {
		const before = await rows();
		const move = { afterRank: before[2].rank, expectedVersion: 4 };
		const result = await service.moveTrack(playlistId, ownerId, trackIds[0], move);
		expect(result).toMatchObject({ trackId: trackIds[0], tracksVersion: 5, rebalanced: false });

		const after = await rows();
		expect(after.map(r => r.track_id)).toEqual([
			trackIds[1],
			trackIds[2],
			trackIds[0],
			trackIds[3],
		]);
		expect(after.find(r => r.track_id === trackIds[0])).toEqual({
			track_id: trackIds[0],
			rank: result.rank,
			added_by: ownerId,
		});
		expect(notifyPlaylistUpdate).toHaveBeenLastCalledWith({
			playlistId,
			tracksVersion: 5,
			rebalanced: false,
			event: 'track_moved',
			trackId: trackIds[0],
			rank: result.rank,
		});

		notifyPlaylistUpdate.mockClear();
		const error = await rejection(service.moveTrack(playlistId, ownerId, trackIds[0], move));
		expect(error).toMatchObject({ statusCode: 409, code: 'TRACK_MOVED_CONCURRENTLY' });
		expect(notifyPlaylistUpdate).not.toHaveBeenCalled();
	});

	it('refuses the move of a removed track with 409 TRACK_NOT_IN_PLAYLIST', async () => {
		await service.removeTrack(playlistId, ownerId, trackIds[2]);
		const error = await rejection(
			service.moveTrack(playlistId, ownerId, trackIds[2], { afterRank: null, expectedVersion: 4 })
		);
		expect(error).toMatchObject({ statusCode: 409, code: 'TRACK_NOT_IN_PLAYLIST' });
	});

	it('maps a missing playlist to 404', async () => {
		const error = await rejection(service.removeTrack(randomUUID(), ownerId, trackIds[0]));
		expect(error).toMatchObject({ statusCode: 404, code: 'PLAYLIST_NOT_FOUND' });
	});

	it('fetches tracks ordered by rank with the version of the playlist', async () => {
		const first = await rows();
		await service.moveTrack(playlistId, ownerId, trackIds[3], {
			afterRank: null,
			expectedVersion: 4,
		});
		const playlist = await playlists.getPlaylistById(playlistId, ownerId);
		expect(playlist.tracksVersion).toBe(5);
		expect(playlist.tracks.map(t => t.id)).toEqual([
			trackIds[3],
			trackIds[0],
			trackIds[1],
			trackIds[2],
		]);
		const ranks = playlist.tracks.map(t => t.rank);
		expect([...ranks].sort()).toEqual(ranks);
		expect(playlist.tracks[1]).toMatchObject({ rank: first[0].rank, addedBy: ownerId });
		expect(playlist.tracks[0]).not.toHaveProperty('position');
	});

	it('keeps every track once and added_by intact under concurrent move, add and remove', async () => {
		const before = await rows();
		const results = await Promise.allSettled([
			service.moveTrack(playlistId, ownerId, trackIds[0], {
				afterRank: before[3].rank,
				expectedVersion: 4,
			}),
			service.moveTrack(playlistId, ownerId, trackIds[3], { afterRank: null, expectedVersion: 4 }),
			service.moveTrack(playlistId, ownerId, trackIds[3], {
				afterRank: before[1].rank,
				expectedVersion: 4,
			}),
			service.addTrack(playlistId, ownerId, dto(4)),
			service.addTrack(playlistId, ownerId, dto(5)),
			service.removeTrack(playlistId, ownerId, trackIds[2]),
		]);

		const refusals = results.flatMap(r => (r.status === 'rejected' ? [r.reason as AppError] : []));
		// Only the second move of trackIds[3] may lose, and only with the documented code.
		expect(refusals).toHaveLength(1);
		expect(refusals[0]).toMatchObject({ statusCode: 409, code: 'TRACK_MOVED_CONCURRENTLY' });

		const after = await rows();
		const ids = after.map(r => r.track_id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(after.map(r => r.rank)).size).toBe(after.length);
		expect(ids).toHaveLength(5);
		expect(ids).not.toContain(trackIds[2]);
		expect(after.every(r => r.added_by === ownerId)).toBe(true);

		const playlist = await playlists.getPlaylistById(playlistId, ownerId);
		expect(playlist.tracksVersion).toBe(4 + results.length - refusals.length);
		expect(playlist.tracks.map(t => t.id)).toEqual(ids);
	});
});
