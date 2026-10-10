/**
 * Fixtures for the HTTP load tests (`make perf-fixtures`, `make perf-test`).
 *
 * Creates or refreshes PERF_USERS users (default 20) in the Supabase project of
 * backend/.env (shell variables win, so the local stack works too):
 * - auth users `perf-<i>@zumik.test` with a new random password on every run,
 *   and verified profiles `perf_<i>`;
 * - perf_0 and every other user follow each other (friends);
 * - a device of perf_0 and a control licence on it for every friend;
 * - one public, open playlist `perf-shared` owned by perf_0, emptied of the
 *   tracks a previous run left behind.
 * Then signs every user in and writes tests/performance/fixtures/users.csv
 * (email,password,token,userId) and fixtures/env.json, both git-ignored.
 *
 * Run from backend/: `npx tsx src/test/perf-fixtures.ts`.
 */
import { randomBytes } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { createSignInClient, supabaseAdmin } from '@/shared/config/supabase.js';

const PLAYLIST_NAME = 'perf-shared';
const DEVICE_ID = 'perf-device-0';
/** Prefix of the track URIs the track-edit scenario adds (tests/performance/scenarios). */
const PERF_TRACK_URI_PREFIX = 'https://soundcloud.com/zumik-perf/';
const BATCH_SIZE = 5;

const userCount = z.coerce
	.number()
	.int()
	.min(2, 'PERF_USERS must be at least 2 (perf_0 plus one friend)')
	.max(500)
	.parse(process.env.PERF_USERS ?? '20');

const fixturesDir = new URL('../../../tests/performance/fixtures/', import.meta.url);

interface PerfUser {
	index: number;
	email: string;
	password: string;
	id: string;
	token: string;
}

function fail(step: string, error: { message: string }): never {
	throw new Error(`${step}: ${error.message}`);
}

/** Runs fn on every item, BATCH_SIZE at a time, keeping the order. */
async function inBatches<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = [];
	for (let i = 0; i < items.length; i += BATCH_SIZE) {
		results.push(...(await Promise.all(items.slice(i, i + BATCH_SIZE).map(fn))));
	}
	return results;
}

/** Creates the auth user or resets its password; returns its id. */
async function upsertAuthUser(email: string, password: string): Promise<string> {
	const { data: existingId, error: findError } = await supabaseAdmin.rpc(
		'find_auth_user_id_by_email',
		{ p_email: email }
	);
	if (findError) fail(`find ${email}`, findError);

	if (existingId) {
		const { error } = await supabaseAdmin.auth.admin.updateUserById(existingId, {
			password,
			email_confirm: true,
		});
		if (error) fail(`update ${email}`, error);
		return existingId;
	}

	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
	});
	if (error) fail(`create ${email}`, error);
	return data.user.id;
}

async function upsertUser(index: number): Promise<Omit<PerfUser, 'token'>> {
	const email = `perf-${index}@zumik.test`;
	const password = randomBytes(18).toString('base64url');
	const id = await upsertAuthUser(email, password);

	const { error } = await supabaseAdmin.from('user_profiles').upsert(
		{
			id,
			username: `perf_${index}`,
			display_name: `Perf ${index}`,
			email_verified: true,
			has_password: true,
		},
		{ onConflict: 'id' }
	);
	if (error) fail(`profile perf_${index}`, error);

	return { index, email, password, id };
}

async function linkFriendsAndDevice(ownerId: string, friendIds: string[]): Promise<void> {
	const follows = friendIds.flatMap(friendId => [
		{ follower_id: ownerId, following_id: friendId },
		{ follower_id: friendId, following_id: ownerId },
	]);
	const { error: followError } = await supabaseAdmin
		.from('follows')
		.upsert(follows, { onConflict: 'follower_id,following_id', ignoreDuplicates: true });
	if (followError) fail('follows', followError);

	const { error: deviceError } = await supabaseAdmin.from('devices').upsert(
		{
			user_id: ownerId,
			device_id: DEVICE_ID,
			device_name: 'Perf device',
			platform: 'perf',
			model: 'perf',
		},
		{ onConflict: 'user_id,device_id' }
	);
	if (deviceError) fail('device', deviceError);

	const licences = friendIds.map(friendId => ({
		owner_id: ownerId,
		device_id: DEVICE_ID,
		grantee_id: friendId,
	}));
	const { error: licenceError } = await supabaseAdmin
		.from('device_control_licenses')
		.upsert(licences, { onConflict: 'owner_id,device_id,grantee_id', ignoreDuplicates: true });
	if (licenceError) fail('device licences', licenceError);
}

/** Finds or creates perf-shared, public and open, and removes leftover perf tracks. */
async function upsertSharedPlaylist(ownerId: string): Promise<string> {
	const { data: found, error: findError } = await supabaseAdmin
		.from('playlists')
		.select('id')
		.eq('owner_id', ownerId)
		.eq('name', PLAYLIST_NAME)
		.order('created_at')
		.limit(1);
	if (findError) fail('find playlist', findError);

	let playlistId = found[0]?.id;
	if (playlistId) {
		const { error } = await supabaseAdmin
			.from('playlists')
			.update({ visibility: 'public', edit_mode: 'open' })
			.eq('id', playlistId);
		if (error) fail('update playlist', error);
	} else {
		const { data, error } = await supabaseAdmin
			.from('playlists')
			.insert({
				name: PLAYLIST_NAME,
				description: 'Load test playlist (make perf-test)',
				owner_id: ownerId,
				visibility: 'public',
				edit_mode: 'open',
			})
			.select('id')
			.single();
		if (error) fail('create playlist', error);
		playlistId = data.id;
	}

	const { error: clearError } = await supabaseAdmin
		.from('playlist_tracks')
		.delete()
		.eq('playlist_id', playlistId);
	if (clearError) fail('clear playlist', clearError);

	const { error: tracksError } = await supabaseAdmin
		.from('tracks')
		.delete()
		.like('track_uri', `${PERF_TRACK_URI_PREFIX}%`);
	if (tracksError) fail('delete perf tracks', tracksError);

	return playlistId;
}

async function signIn(user: Omit<PerfUser, 'token'>): Promise<PerfUser> {
	// One client per sign-in: a sign-in keeps its session on the client.
	const { data, error } = await createSignInClient().auth.signInWithPassword({
		email: user.email,
		password: user.password,
	});
	if (error) fail(`sign in ${user.email}`, error);
	return { ...user, token: data.session.access_token };
}

async function main(): Promise<void> {
	console.log(`Preparing ${userCount} perf users...`);
	const indexes = Array.from({ length: userCount }, (_, i) => i);
	const created = await inBatches(indexes, upsertUser);

	const [owner, ...friends] = created;
	await linkFriendsAndDevice(
		owner.id,
		friends.map(friend => friend.id)
	);
	const sharedPlaylistId = await upsertSharedPlaylist(owner.id);

	console.log('Signing the perf users in...');
	const users = await inBatches(created, signIn);

	await mkdir(fixturesDir, { recursive: true });
	const csvFile = new URL('users.csv', fixturesDir);
	const csv = [
		'email,password,token,userId',
		...users.map(u => `${u.email},${u.password},${u.token},${u.id}`),
	].join('\n');
	await writeFile(csvFile, `${csv}\n`, { mode: 0o600 });
	await chmod(csvFile, 0o600);

	const env = { sharedPlaylistId, ownerId: owner.id, deviceId: DEVICE_ID, userCount };
	await writeFile(new URL('env.json', fixturesDir), `${JSON.stringify(env, null, 2)}\n`);

	console.log(`Fixtures written to tests/performance/fixtures/ (playlist ${sharedPlaylistId})`);
}

main().then(
	() => process.exit(0),
	(error: unknown) => {
		console.error(
			`Perf fixtures failed: ${error instanceof Error ? error.message : String(error)}`
		);
		process.exit(1);
	}
);
