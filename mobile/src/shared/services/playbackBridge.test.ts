const bridge = {
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 64,
	useActiveQueue: () => ({ currentItemId: null, items: [], version: 0 }),
	addToQueue: () => Promise.resolve(true),
	playNext: () => Promise.resolve(true),
	playPlaylist: () => Promise.resolve('played'),
	next: () => Promise.resolve('played' as const),
	previous: () => Promise.resolve('played' as const),
	playListTrack: () => Promise.resolve(),
	playTrack: () => undefined,
	pause: () => undefined,
	resume: () => undefined,
	stop: () => undefined,
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
};

describe('playbackBridge', () => {
	it('logs and throws when used before registration', () => {
		jest.isolateModules(() => {
			const { logger } =
				jest.requireActual<typeof import('@/shared/utils/logger')>('@/shared/utils/logger');
			const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
			const mod = jest.requireActual<typeof import('./playbackBridge')>('./playbackBridge');
			expect(() => mod.getPlayback()).toThrow('Used before');
			expect(error).toHaveBeenCalled();
			error.mockRestore();
		});
	});

	it('returns the registered implementation, and refuses a second one', () => {
		jest.isolateModules(() => {
			const mod = jest.requireActual<typeof import('./playbackBridge')>('./playbackBridge');
			mod.registerPlaybackBridge(bridge);
			expect(mod.getPlayback()).toBe(bridge);
			expect(() => mod.registerPlaybackBridge(bridge)).toThrow('Already registered');
		});
	});
});
