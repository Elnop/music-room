import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as streamService from '@/features/soundcloud/services/soundcloud-stream.service.js';
import * as cache from '@/features/soundcloud/utils/soundcloud-cache.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SoundCloudClient } from '@/features/soundcloud/soundcloud.types.js';

type StreamLink = (trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>;

const TRACK_URL = 'https://soundcloud.com/artist/song';
const HLS_URL = 'https://cf-hls-media.sndcdn.test/playlist.m3u8';
const PROGRESSIVE_URL = 'https://cf-media.sndcdn.test/song.mp3';
const T0 = new Date('2026-01-01T00:00:00.000Z');
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const TWENTY_MINUTES_MS = 20 * 60 * 1000;
const EXPIRES_AT = new Date(T0.getTime() + THIRTY_MINUTES_MS).toISOString();

const withExpiry = (streamUrl: string) => ({ streamUrl, expiresAt: EXPIRES_AT });

const { client, streamLink } = vi.hoisted(() => {
	const streamLink = vi.fn<(trackUrl: string, protocol: 'hls' | 'progressive') => Promise<string>>();
	const client: Pick<SoundCloudClient, 'util'> = { util: { streamLink } };
	return { client, streamLink };
});

vi.mock('@/features/soundcloud/utils/soundcloud-client.js', () => ({ soundcloud: client }));

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
		client.util = { streamLink };
		cache.clear();
		vi.useFakeTimers();
		vi.setSystemTime(T0);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the HLS URL without asking for progressive', async () => {
		streamLink.mockImplementation(linkFor({ hls: HLS_URL, progressive: PROGRESSIVE_URL }));

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(HLS_URL));
		expect(streamLink).toHaveBeenCalledTimes(1);
		expect(streamLink).toHaveBeenCalledWith(TRACK_URL, 'hls');
	});

	it('falls back to progressive when HLS is empty', async () => {
		streamLink.mockImplementation(linkFor({ hls: '', progressive: PROGRESSIVE_URL }));

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(PROGRESSIVE_URL));
		expect(streamLink).toHaveBeenNthCalledWith(1, TRACK_URL, 'hls');
		expect(streamLink).toHaveBeenNthCalledWith(2, TRACK_URL, 'progressive');
	});

	it('falls back to progressive when HLS throws', async () => {
		streamLink.mockImplementation(
			linkFor({ hls: new Error('no hls'), progressive: PROGRESSIVE_URL })
		);

		expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(PROGRESSIVE_URL));
	});

	it('throws a 404 STREAM_NOT_FOUND when no protocol yields a URL, and caches nothing', async () => {
		streamLink.mockImplementation(linkFor({ hls: '', progressive: new Error('gone') }));

		await expectAppError(streamService.getStreamUrl(TRACK_URL), 404, 'STREAM_NOT_FOUND');
		expect(streamLink).toHaveBeenCalledTimes(2);

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

	describe.each([
		{ path: 'HLS', urls: { hls: HLS_URL }, expected: HLS_URL, callsPerFetch: 1 },
		{
			path: 'progressive',
			urls: { hls: '', progressive: PROGRESSIVE_URL },
			expected: PROGRESSIVE_URL,
			callsPerFetch: 2,
		},
	])('stream URL cache ($path)', ({ urls, expected, callsPerFetch }) => {
		beforeEach(() => {
			streamLink.mockImplementation(linkFor(urls));
		});

		it('serves a cached URL on the next call', async () => {
			expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(expected));
			expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(expected));
			expect(streamLink).toHaveBeenCalledTimes(callsPerFetch);
		});

		it('keeps the original expiresAt on a cached URL', async () => {
			await streamService.getStreamUrl(TRACK_URL);
			vi.setSystemTime(T0.getTime() + TWENTY_MINUTES_MS - 1);

			expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(expected));
			expect(streamLink).toHaveBeenCalledTimes(callsPerFetch);
		});

		it('still serves the cached URL at exactly 20 minutes', async () => {
			await streamService.getStreamUrl(TRACK_URL);
			vi.setSystemTime(T0.getTime() + TWENTY_MINUTES_MS);

			expect(await streamService.getStreamUrl(TRACK_URL)).toEqual(withExpiry(expected));
			expect(streamLink).toHaveBeenCalledTimes(callsPerFetch);
		});

		it('refetches the URL 1 ms after 20 minutes, with a new expiresAt', async () => {
			await streamService.getStreamUrl(TRACK_URL);
			const refetchAt = T0.getTime() + TWENTY_MINUTES_MS + 1;
			vi.setSystemTime(refetchAt);

			expect(await streamService.getStreamUrl(TRACK_URL)).toEqual({
				streamUrl: expected,
				expiresAt: new Date(refetchAt + THIRTY_MINUTES_MS).toISOString(),
			});
			expect(streamLink).toHaveBeenCalledTimes(callsPerFetch * 2);
		});
	});
});
