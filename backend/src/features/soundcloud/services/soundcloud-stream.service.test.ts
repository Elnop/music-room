import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as streamService from '@/features/soundcloud/services/soundcloud-stream.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SoundCloudClient } from '@/shared/soundcloud/soundcloud-client.js';

type StreamLink = (trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>;

const TRACK_URL = 'https://soundcloud.com/artist/song';
const HLS_URL = 'https://cf-hls-media.sndcdn.test/playlist.m3u8';
const PROGRESSIVE_URL = 'https://cf-media.sndcdn.test/song.mp3';
const T0 = new Date('2026-01-01T00:00:00.000Z');
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const EXPIRES_AT = new Date(T0.getTime() + THIRTY_MINUTES_MS).toISOString();

const withExpiry = (streamUrl: string, protocol: 'hls' | 'progressive') => ({
	streamUrl,
	protocol,
	expiresAt: EXPIRES_AT,
});

const { client, streamLink } = vi.hoisted(() => {
	const streamLink =
		vi.fn<(trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>>();
	const client: Pick<SoundCloudClient, 'util'> = { util: { streamLink } };
	return { client, streamLink };
});

vi.mock('@/shared/soundcloud/soundcloud-client.js', () => ({ soundcloud: client }));

const markTrackUriUnavailable = vi.hoisted(() => vi.fn());
vi.mock('@/shared/soundcloud/track-availability.js', () => ({ markTrackUriUnavailable }));

function linkFor(urls: { hls?: string | Error; progressive?: string | Error }): StreamLink {
	return (_trackUrl, protocol) => {
		const value = urls[protocol] ?? '';
		return value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
	};
}

async function expectAppError(promise: Promise<unknown>, statusCode: number, code: string) {
	const error: unknown = await promise.catch((e: unknown) => e);
	expect(error).toBeInstanceOf(AppError);
	expect(error).toMatchObject({ statusCode, code });
}

describe('soundcloud-stream.service', () => {
	beforeEach(() => {
		streamLink.mockReset();
		markTrackUriUnavailable.mockReset();
		client.util = { streamLink };
		vi.useFakeTimers();
		vi.setSystemTime(T0);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the HLS URL without asking for progressive', async () => {
		streamLink.mockImplementation(linkFor({ hls: HLS_URL, progressive: PROGRESSIVE_URL }));

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(HLS_URL, 'hls'));
		expect(streamLink).toHaveBeenCalledTimes(1);
		expect(streamLink).toHaveBeenCalledWith(TRACK_URL, 'hls');
	});

	it('falls back to progressive when HLS is empty', async () => {
		streamLink.mockImplementation(linkFor({ hls: '', progressive: PROGRESSIVE_URL }));

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(PROGRESSIVE_URL, 'progressive'));
		expect(streamLink).toHaveBeenNthCalledWith(1, TRACK_URL, 'hls');
		expect(streamLink).toHaveBeenNthCalledWith(2, TRACK_URL, 'progressive');
	});

	it('falls back to progressive when HLS throws', async () => {
		streamLink.mockImplementation(
			linkFor({ hls: new Error('no hls'), progressive: PROGRESSIVE_URL })
		);

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(PROGRESSIVE_URL, 'progressive'));
	});

	it('throws a 404 STREAM_NOT_FOUND and marks the track unavailable when no protocol yields a URL', async () => {
		streamLink.mockImplementation(linkFor({ hls: '', progressive: new Error('gone') }));

		await expectAppError(streamService.getStreamUrl(TRACK_URL), 404, 'STREAM_NOT_FOUND');
		expect(streamLink).toHaveBeenCalledTimes(2);
		expect(markTrackUriUnavailable).toHaveBeenCalledWith(TRACK_URL);

		await expectAppError(streamService.getStreamUrl(TRACK_URL), 404, 'STREAM_NOT_FOUND');
		expect(streamLink).toHaveBeenCalledTimes(4);
	});

	it.each([
		['both empty', { hls: '', progressive: '' }],
		['both throw', { hls: new Error('no hls'), progressive: new Error('gone') }],
	])('throws a 404 STREAM_NOT_FOUND when %s', async (_label, links) => {
		streamLink.mockImplementation(linkFor(links));

		await expectAppError(streamService.getStreamUrl(TRACK_URL), 404, 'STREAM_NOT_FOUND');
	});

	it('throws a 500 API_ERROR when the client has no util', async () => {
		client.util = undefined;
		await expectAppError(streamService.getStreamUrl(TRACK_URL), 500, 'API_ERROR');
	});

	it('fetches a fresh URL on every call, with a new expiresAt', async () => {
		streamLink.mockImplementation(linkFor({ hls: HLS_URL }));
		await streamService.getStreamUrl(TRACK_URL);
		const later = T0.getTime() + 60_000;
		vi.setSystemTime(later);

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual({
			streamUrl: HLS_URL,
			protocol: 'hls',
			expiresAt: new Date(later + THIRTY_MINUTES_MS).toISOString(),
		});
		expect(streamLink).toHaveBeenCalledTimes(2);
	});
});
