import React from 'react';
import { render } from '@testing-library/react-native';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { PlaylistPlayback } from '@/shared/playback/types/playbackActionsTypes';
import type { QueueItem } from '@/shared/playback/types/queueTypes';
import { PlaylistPlaybackContainer } from '@/features/playback/components/PlaylistPlaybackContainer';
import { signIn } from '@test-utils/signIn';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const item = { id: 'q1', sourcePlaylistId: 'p1' } as QueueItem;
const URI = 'https://soundcloud.com/a/song';

function playbackOf(playlistId: string) {
	let reported: PlaylistPlayback | undefined;
	render(
		<PlaylistPlaybackContainer playlistId={playlistId}>
			{(playback) => {
				reported = playback;
				return null;
			}}
		</PlaylistPlaybackContainer>,
	);
	return reported;
}

beforeEach(() => {
	signIn('me');
	queueStore.setState({
		queues: { me: { currentItemId: 'q1', items: [item], version: 1 } },
	});
	playerStore.setState({
		queueItemId: 'q1',
		playbackState: 'playing',
		currentTrack: { permalink_url: URI } as never,
	});
});

describe('PlaylistPlaybackContainer', () => {
	it('reports what plays from a playlist, and nothing for another one', () => {
		expect(playbackOf('p1')).toMatchObject({ playingUri: URI, state: 'playing' });
		expect(playbackOf('p2')).toMatchObject({ playingUri: null, state: null });
	});
});
