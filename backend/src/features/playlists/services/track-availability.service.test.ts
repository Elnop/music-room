import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as service from '@/features/playlists/services/track-availability.service.js';

type Result = { data: unknown; error: { message: string } | null };

const m = vi.hoisted(() => {
	const results: Result[] = [];
	const from = vi.fn(() => {
		const result = results.shift();
		const builder: Record<string, unknown> = {};
		for (const step of ['select', 'eq']) builder[step] = () => builder;
		builder.then = (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve);
		return builder;
	});
	return {
		results,
		from,
		check: vi.fn(),
		save: vi.fn(),
		notify: vi.fn(),
		error: vi.fn(),
	};
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/soundcloud/track-availability.js', () => ({
	checkTrackAvailability: m.check,
	saveTrackAvailability: m.save,
}));
vi.mock('@/realtime/emitters/playlist.emitters.js', () => ({ notifyTracksAvailability: m.notify }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: m.error, debug: vi.fn() },
}));

const NOW = new Date('2026-01-02T00:00:00.000Z').getTime();
const fresh = new Date(NOW - 1000).toISOString();
const stale = new Date(NOW - service.RECHECK_AFTER_MS).toISOString();

const row = (id: string, checkedAt: string | null, unavailableAt: string | null = null) => ({
	tracks: {
		id,
		track_uri: `https://soundcloud.com/a/${id}`,
		unavailable_at: unavailableAt,
		availability_checked_at: checkedAt,
	},
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
	m.results.length = 0;
	m.save.mockResolvedValue(undefined);
});

describe('refreshPlaylistAvailability', () => {
	it('checks only the tracks never checked or checked a day ago or more', async () => {
		m.results.push({ data: [row('a', null), row('b', fresh), row('c', stale)], error: null });
		m.check.mockResolvedValue('available');

		await service.refreshPlaylistAvailability('p');

		expect(m.check.mock.calls.map(([uri]) => uri)).toEqual([
			'https://soundcloud.com/a/a',
			'https://soundcloud.com/a/c',
		]);
		expect(m.save).toHaveBeenCalledWith('a', false, null);
		expect(m.notify).not.toHaveBeenCalled();
	});

	it('broadcasts the tracks whose availability changed, in both directions', async () => {
		m.results.push({
			data: [row('gone', null), row('back', stale, fresh), row('same', null)],
			error: null,
		});
		m.check.mockImplementation((uri: string) =>
			Promise.resolve(uri.endsWith('gone') ? 'unavailable' : 'available')
		);

		await service.refreshPlaylistAvailability('p');

		expect(m.save).toHaveBeenCalledWith('back', false, fresh);
		expect(m.notify).toHaveBeenCalledWith({
			playlistId: 'p',
			tracks: expect.arrayContaining([
				{ trackId: 'gone', unavailable: true },
				{ trackId: 'back', unavailable: false },
			]),
		});
		expect(m.notify.mock.calls[0][0].tracks).toHaveLength(2);
	});

	it('keeps the stored state when SoundCloud does not answer', async () => {
		m.results.push({ data: [row('a', null)], error: null });
		m.check.mockResolvedValue('unknown');

		await service.refreshPlaylistAvailability('p');

		expect(m.save).not.toHaveBeenCalled();
		expect(m.notify).not.toHaveBeenCalled();
	});

	it('never throws, and logs a failure', async () => {
		m.results.push({ data: null, error: { message: 'db down' } });

		await expect(service.refreshPlaylistAvailability('p')).resolves.toBeUndefined();
		expect(m.error).toHaveBeenCalled();
	});

	it('does not check a track twice when the playlist is opened twice at once', async () => {
		m.results.push(
			{ data: [row('a', null)], error: null },
			{ data: [row('a', null)], error: null }
		);
		let answer: (value: string) => void = () => undefined;
		m.check.mockReturnValueOnce(new Promise(resolve => (answer = resolve)));

		const first = service.refreshPlaylistAvailability('p');
		await vi.waitFor(() => expect(m.check).toHaveBeenCalledTimes(1));
		await service.refreshPlaylistAvailability('p');
		answer('available');
		await first;

		expect(m.check).toHaveBeenCalledTimes(1);
	});
});
