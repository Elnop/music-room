import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as queue from '@/features/queue/services/queue.service.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// No Socket.io server runs here: the emitters are no-ops.

const URI_PREFIX = `https://soundcloud.com/int-availability/${randomUUID()}`;
const users: string[] = [];
let userId: string;
let trackCount = 0;

async function createUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	users.push(data.user.id);
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username: `int_${data.user.id.slice(0, 8)}` });
	if (profileError) throw profileError;
	return data.user.id;
}

const dto = () => {
	trackCount += 1;
	return {
		trackUri: `${URI_PREFIX}/${trackCount}`,
		title: `T${trackCount}`,
		artist: 'A',
		durationMs: 1000,
	};
};

async function markUnavailable(trackUri: string) {
	const { error } = await supabaseAdmin
		.from('tracks')
		.update({ unavailable_at: new Date().toISOString() })
		.eq('track_uri', trackUri);
	if (error) throw error;
}

async function trackId(trackUri: string): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('tracks')
		.select('id')
		.eq('track_uri', trackUri)
		.single();
	if (error) throw error;
	return data.id;
}

/** Written straight to the tables: the playlist services belong to another feature. */
async function createPlaylist(n: number): Promise<{ id: string; uris: string[] }> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.insert({ owner_id: userId, name: 'int-availability', visibility: 'public' })
		.select('id')
		.single();
	if (error) throw error;
	const uris = Array.from({ length: n }, () => dto().trackUri);
	const { data: tracks, error: tracksError } = await supabaseAdmin
		.from('tracks')
		.insert(
			uris.map(trackUri => ({ track_uri: trackUri, title: 'T', artist: 'A', duration_ms: 1000 }))
		)
		.select('id, track_uri');
	if (tracksError) throw tracksError;
	const { error: linkError } = await supabaseAdmin.from('playlist_tracks').insert(
		uris.map((uri, i) => ({
			playlist_id: playlist.id,
			track_id: tracks.find(track => track.track_uri === uri)?.id ?? '',
			rank: String.fromCharCode(98 + i),
		}))
	);
	if (linkError) throw linkError;
	return { id: playlist.id, uris };
}

const uris = (state: QueueState) => state.items.map(item => item.track.trackUri);
const unavailable = { statusCode: 409, code: 'TRACK_UNAVAILABLE' };

beforeEach(async () => {
	userId = await createUser();
});

afterAll(async () => {
	for (const id of users) await supabaseAdmin.auth.admin.deleteUser(id);
	await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
});

describe('unavailable tracks in the queue', () => {
	it('refuses to add an unavailable track', async () => {
		const track = dto();
		await queue.addItem(userId, userId, track);
		await markUnavailable(track.trackUri);

		await expect(queue.addItem(userId, userId, track)).rejects.toMatchObject(unavailable);
		expect((await queue.getQueue(userId, userId)).items).toHaveLength(1);
	});

	it('refuses to play an item whose track became unavailable', async () => {
		const track = dto();
		const state = await queue.addItem(userId, userId, track);
		await markUnavailable(track.trackUri);

		await expect(queue.playItem(userId, userId, state.items[0].id)).rejects.toMatchObject(
			unavailable
		);
	});

	it('skips unavailable items on next and previous', async () => {
		const tracks = [dto(), dto(), dto()];
		let state: QueueState | undefined;
		for (const track of tracks) state = await queue.addItem(userId, userId, track);
		const [first, , third] = state?.items ?? [];
		await markUnavailable(tracks[1].trackUri);

		await queue.step(userId, userId, 'next');
		expect((await queue.step(userId, userId, 'next')).currentItemId).toBe(third.id);
		expect((await queue.step(userId, userId, 'previous')).currentItemId).toBe(first.id);
	});

	it('skips an unavailable item when the current one is removed', async () => {
		const tracks = [dto(), dto(), dto()];
		let state: QueueState | undefined;
		for (const track of tracks) state = await queue.addItem(userId, userId, track);
		const [first, , third] = state?.items ?? [];
		await queue.playItem(userId, userId, first.id);
		await markUnavailable(tracks[1].trackUri);

		expect((await queue.removeItem(userId, userId, first.id)).currentItemId).toBe(third.id);
	});

	it('copies only the available tracks of a played playlist', async () => {
		const playlist = await createPlaylist(3);
		await markUnavailable(playlist.uris[0]);

		const state = await queue.playPlaylist(userId, userId, playlist.id);

		expect(uris(state)).toEqual(playlist.uris.slice(1));
		expect(state.currentItemId).toBe(state.items[0].id);
	});

	it('refuses an unavailable starting track, and a playlist with no available track', async () => {
		const playlist = await createPlaylist(2);
		await markUnavailable(playlist.uris[0]);
		const start = await trackId(playlist.uris[0]);

		await expect(
			queue.playPlaylist(userId, userId, playlist.id, undefined, start)
		).rejects.toMatchObject(unavailable);

		await markUnavailable(playlist.uris[1]);
		await expect(queue.playPlaylist(userId, userId, playlist.id)).rejects.toMatchObject({
			statusCode: 409,
			code: 'PLAYLIST_EMPTY',
		});
		expect((await queue.getQueue(userId, userId)).items).toHaveLength(0);
	});
});
